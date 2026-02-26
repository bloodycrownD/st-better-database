import {
    type DataStorage,
    ExportFormat,
    type SqlExecutor,
    type SqlResult,
    SqlType,
    type TableSchema
} from "@/infra/sql";
import {ChatMessageManager} from '@/infra/sillytarvern/message/chat-message-manager.ts';
import {CompactSqlConverter} from '@/infra/sql/impl/utils/compact-sql-converter.ts';

export class ChatSqlExecutor implements SqlExecutor {
    private readonly tableTemplate: SqlExecutor;
    private cachedStorage: SqlExecutor | null = null;
    private cachedCommittedHash: string = '';

    constructor(tableTemplate: SqlExecutor) {
        this.tableTemplate = tableTemplate.clone();
    }

    getTables(): TableSchema[] {
        return this.tableTemplate.getTables();
    }

    clone(): SqlExecutor {
        return this.tableTemplate.clone();
    }

    compressDml(dml: string): string {
        const tableSchemas = this.getTableSchemas();
        return CompactSqlConverter.compressDml(dml, tableSchemas);
    }

    decompressDml(compressedDml: string): string {
        const tableSchemas = this.getTableSchemas();
        return CompactSqlConverter.decompressDml(compressedDml, tableSchemas);
    }

    private getTableSchemas(): Record<number, any> {
        const tables = this.getTables();
        const tableSchemas: Record<number, any> = {};
        for (const table of tables) {
            const tableIdx = this.getTableIdxByName(table.tableName);
            if (tableIdx !== undefined) {
                tableSchemas[tableIdx] = table;
            }
        }
        return tableSchemas;
    }

    execute(sql: string, sqlTypes: SqlType[]): SqlResult {
        const sqlList = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        if (sqlList.length === 0) {
            return {success: true, message: '无SQL语句', data: 0, type: SqlType.DML};
        }

        let affectedRows = 0;
        let dmlBuffer: string[] = [];
        let ddlBuffer: string[] = [];

        for (const currentSql of sqlList) {
            const sqlType = this.detectSqlType(currentSql);

            if (!sqlTypes.includes(sqlType)) {
                throw new Error(`期望的SQL类型为 ${sqlTypes.join(' 或 ')}，实际为 ${sqlType}`);
            }

            if (sqlType === SqlType.DML) {
                if (ddlBuffer.length > 0) {
                    this.tableTemplate.execute(ddlBuffer.join(';\n'), [SqlType.DDL]);
                    ddlBuffer = [];
                }
                dmlBuffer.push(currentSql);
            } else if (sqlType === SqlType.DDL) {
                if (dmlBuffer.length > 0) {
                    affectedRows += this.executeDml(dmlBuffer.join(';\n'));
                    dmlBuffer = [];
                }
                ddlBuffer.push(currentSql);
            } else if (sqlType === SqlType.DQL) {
                if (ddlBuffer.length > 0) {
                    this.tableTemplate.execute(ddlBuffer.join(';\n'), [SqlType.DDL]);
                    ddlBuffer = [];
                }
                if (dmlBuffer.length > 0) {
                    affectedRows += this.executeDml(dmlBuffer.join(';\n'));
                    dmlBuffer = [];
                }
                return this.storage.execute(currentSql, [SqlType.DQL]);
            }
        }

        if (ddlBuffer.length > 0) {
            this.tableTemplate.execute(ddlBuffer.join(';\n'), [SqlType.DDL]);
        }
        if (dmlBuffer.length > 0) {
            affectedRows += this.executeDml(dmlBuffer.join(';\n'));
        }

        return {success: true, message: '执行成功', data: affectedRows, type: SqlType.DML};
    }

    private detectSqlType(sql: string): SqlType {
        const trimmedSql = sql.trim().toUpperCase();

        if (/^CREATE\s+TABLE|^ALTER\s+TABLE|^DROP\s+TABLE/i.test(trimmedSql)) {
            return SqlType.DDL;
        }
        if (/^SELECT/i.test(trimmedSql)) {
            return SqlType.DQL;
        }
        if (/^INSERT|^UPDATE|^DELETE|^APPEND/i.test(trimmedSql)) {
            return SqlType.DML;
        }

        throw new Error(`无法识别SQL类型: ${sql}`);
    }

    private executeDml(sql: string): number {
        const compressedDml = this.compressDml(sql);
        console.log('[ChatSqlExecutor] executeDml: original SQL length:', sql.length, 'compressed length:', compressedDml.length);
        console.log('[ChatSqlExecutor] executeDml: statements count:', sql.split(';').filter(s => s.trim()).length);
        ChatMessageManager.processLastCommitted(content => {
            const origin = content || '';
            const originLength = origin.length;
            const newCommitted = origin ? `${origin};\n${compressedDml}` : compressedDml;
            console.log('[ChatSqlExecutor] executeDml: appending to committed. Origin length:', originLength, 'new length:', newCommitted.length);
            return `<committed>${newCommitted}</committed>`;
        });
        this.invalidateStorageCache();
        return sql.split(';').map(s => s.trim()).filter(s => s.length > 0).length;
    }

    private invalidateStorageCache(): void {
        this.cachedStorage = null;
        this.cachedCommittedHash = '';
    }

    private computeCommittedHash(): string {
        const committedList = ChatMessageManager.getCommitted();
        return committedList.join('|');
    }

    export(format: ExportFormat, table?: string): string {
        return this.storage.export(format, table);
    }

    private get storage() {
        const currentHash = this.computeCommittedHash();
        console.log('[ChatSqlExecutor] Getting storage, cache hit:', !!this.cachedStorage && this.cachedCommittedHash === currentHash);

        if (this.cachedStorage && this.cachedCommittedHash === currentHash) {
            return this.cachedStorage;
        }

        console.log('[ChatSqlExecutor] Rebuilding storage from committed...');
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const sqlExecutor = this.tableTemplate.clone();

        if (chat.length === 0) {
            this.cachedStorage = sqlExecutor;
            this.cachedCommittedHash = currentHash;
            return sqlExecutor;
        }

        const validStatementsByMessage: Map<number, string[]> = new Map();
        let statementIndex = 0;
        let totalErrors = 0;

        for (let messageIndex = 0; messageIndex < chat.length; messageIndex++) {
            const message = chat[messageIndex];
            if (!message || !message.mes) continue;

            const committedContent = ChatMessageManager.extractCommitted(message.mes);
            if (!committedContent) continue;

            const statements = committedContent.split(';').map(s => s.trim()).filter(s => s.length > 0);
            const validStatements: string[] = [];

            for (const stmt of statements) {
                try {
                    statementIndex++;
                    if (statementIndex % 100 === 0) {
                        console.log(`[ChatSqlExecutor] Processed ${statementIndex} statements...`);
                    }
                    const dml = this.decompressDml(stmt);
                    if (statementIndex <= 10 || statementIndex % 500 === 0) {
                        console.log(`[ChatSqlExecutor] Statement ${statementIndex} (from message ${messageIndex}):`);
                        console.log(`  Compressed (first 150 chars): ${stmt.substring(0, 150)}`);
                        console.log(`  Decompressed (first 150 chars): ${dml.substring(0, 150)}`);
                        console.log(`  Full length: Compressed=${stmt.length}, Decompressed=${dml.length}`);
                    }
                    sqlExecutor.execute(dml, [SqlType.DML]);
                    validStatements.push(stmt);
                } catch (error) {
                    console.error(`[ChatSqlExecutor] Error executing statement from message ${messageIndex}:`, stmt, error);
                    console.error('[ChatSqlExecutor] Full decompressed statement:', this.decompressDml(stmt));
                    totalErrors++;
                }
            }

            validStatementsByMessage.set(messageIndex, validStatements);
        }

        if (totalErrors > 0) {
            console.log(`[ChatSqlExecutor] Found ${totalErrors} errors during rebuild. Cleaning up messages...`);
            
            for (const [messageIndex, validStatements] of validStatementsByMessage.entries()) {
                const message = chat[messageIndex];
                if (!message || !message.mes) continue;
                
                const originalContent = ChatMessageManager.extractCommitted(message.mes);
                const newCommitted = validStatements.join(';\n');
                
                if (originalContent !== newCommitted) {
                    console.log(`[ChatSqlExecutor] Updating message ${messageIndex}: ${originalContent?.length || 0} -> ${newCommitted.length} chars`);
                    
                    ChatMessageManager.processCommitted(messageIndex, () => {
                        if (newCommitted.length > 0) {
                            return `<committed>${newCommitted}</committed>`;
                        } else {
                            return '';
                        }
                    });
                }
            }
        }

        console.log('[ChatSqlExecutor] Storage rebuilt successfully');
        this.cachedStorage = sqlExecutor;
        this.cachedCommittedHash = currentHash;
        return sqlExecutor;
    }

    getDataStorage(): DataStorage {
        return this.storage.getDataStorage();
    }

    getTableIdxByName(tableName: string): number | undefined {
        return this.tableTemplate.getTableIdxByName(tableName);
    }

    getTableNameByIdx(tableIdx: number): string | undefined {
        return this.tableTemplate.getTableNameByIdx(tableIdx);
    }

    setDataStorage(_: DataStorage): void {
    }

    serialize(): object {
        return this.tableTemplate.serialize();
    }

    deserialize(data: object): void {
        this.tableTemplate.deserialize(data);
    }

}
