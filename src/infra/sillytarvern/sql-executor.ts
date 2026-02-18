import {type DataStorage, ExportFormat, type Row, type SqlExecutor, type SqlResult, SqlType, type TableSchema} from "@/infra/sql";
import {ChatMessageManager} from "@/infra/sillytarvern/chat-message-manager.ts";

export class ChatSqlExecutor implements SqlExecutor {
    /**
     * 表格执行器模板，一般不变
     * @private
     */
    private readonly tableTemplate: SqlExecutor;

    constructor(tableTemplate: SqlExecutor) {
        this.tableTemplate = tableTemplate.clone();
    }

    getTables(): TableSchema[] {
        return this.tableTemplate.getTables();
    }

    clone(): SqlExecutor {
        return this.tableTemplate.clone();
    }

    dml2row(sql: string): Row[] {
        return this.tableTemplate.dml2row(sql);
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
        const rows = this.tableTemplate.dml2row(sql);
        ChatMessageManager.processLastRows(content => {
            const origin = JSON.parse(content) as Row[];
            origin.push(...rows)
            return `<commit>${JSON.stringify(origin)}</commit>`;
        })
        return rows.length;
    }

    export(format: ExportFormat, table?: string): string {
        return this.storage.export(format, table);
    }

    /**
     * 填充数据后的执行器
     * @private
     */
    private get storage() {
        const rows = ChatMessageManager.getRows();
        const dml = this.tableTemplate.row2dml(rows);
        const sqlExecutor = this.tableTemplate.clone();
        sqlExecutor.execute(dml, [SqlType.DML]);
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

    row2dml(rows: Row[]): string {
        return this.tableTemplate.row2dml(rows);
    }

    setDataStorage(_: DataStorage): void {
    }

}
