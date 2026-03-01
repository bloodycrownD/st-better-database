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
import {logger} from '@/infra/logger.ts';

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
        const filteredSql = this.filterUnsupportedSyntax(sql);
        const compressedDml = this.compressDml(filteredSql);
        if (sql !== filteredSql) {
            console.log('[ChatSqlExecutor] executeDml: SQL was filtered to remove unsupported syntax');
        }
        ChatMessageManager.processLastCommitted(content => {
            const origin = content || '';
            const newCommitted = origin ? `${origin};\n${compressedDml}` : compressedDml;
            return `<committed>${newCommitted}</committed>`;
        });
        this.invalidateStorageCache();
        return sql.split(';').map(s => s.trim()).filter(s => s.length > 0).length;
    }

    private filterUnsupportedSyntax(sql: string): string {
        let result = sql;
        result = result.replace(/\s+ON\s+CONFLICT\s+\([^)]+\)\s+DO\s+UPDATE\s+SET\s+[^;]+/gi, '');
        result = result.replace(/\s+OR\s+REPLACE/gi, '');
        result = result.replace(/\s+OR\s+IGNORE/gi, '');
        return result.trim();
    }

    private invalidateStorageCache(): void {
        this.cachedStorage = null;
        this.cachedCommittedHash = '';
    }

    export(format: ExportFormat, table?: string): string {
        return this.storage.export(format, table);
    }

    private get storage() {
        const startTime = performance.now();
        const committedMap = ChatMessageManager.getCommitted();
        const hashParts: string[] = [];
        for (const [idx, content] of committedMap.entries()) {
            hashParts.push(`${idx}:${content.length}`);
        }
        const currentHash = hashParts.join('|');
        if (this.cachedStorage && this.cachedCommittedHash === currentHash) {
            logger.debug('ChatSqlExecutor', 'Cache hit - hash: ' + currentHash);
            return this.cachedStorage;
        }
        logger.debug('ChatSqlExecutor', 'Cache miss - old hash: ' + this.cachedCommittedHash + ', new hash: ' + currentHash);
        logger.debug('ChatSqlExecutor', 'Committed SQL count: ' + committedMap.size);
        const sqlExecutor = this.tableTemplate.clone();

        if (committedMap.size === 0) {
        this.cachedStorage = sqlExecutor;
        this.cachedCommittedHash = currentHash;
        const endTime = performance.now();
        logger.debug('ChatSqlExecutor', 'Storage get time: ' + (endTime - startTime) + 'ms');
        return sqlExecutor;
    }
        for (const [idx, committedContent] of committedMap.entries()) {
            try {
                sqlExecutor.execute(this.decompressDml(committedContent), [SqlType.DML]);
            } catch (error) {
                ChatMessageManager.processCommitted(idx, () => {
                    return `<error>${committedContent}</error>`;
                });
            }
        }

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
