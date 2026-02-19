import {SQLBuilder, ExportFormat, SqlType} from "@/infra/sql";
import type {ColumnSchema, SqlExecutor, SqlResult, TableSchema} from "@/infra/sql";
import type {TableManagementService} from "@/service/interfaces/table-management-service.ts";

export abstract class AbstractTableManagementService implements TableManagementService{
    abstract get executor():SqlExecutor;

    createTable(tableName: string, columns: Array<ColumnSchema>, comment?: string): SqlResult {
        const columnDefs = new Map<string, string>();
        const columnComments = new Map<string, string>();
        columns.forEach(col => {
            const typeDef = col.type + (col.primitiveKey ? ' PRIMARY KEY' : '');
            columnDefs.set(col.name, typeDef);
            if (col.comment) {
                columnComments.set(col.name, col.comment);
            }
        });
        const sql = SQLBuilder.ddl().createTable(tableName, columnDefs, comment, columnComments);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    dropTable(tableName: string): SqlResult {
        const sql = SQLBuilder.ddl().dropTable(tableName);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    addColumn(tableName: string, columnName: string, columnType: ColumnSchema): SqlResult {
        const typeDef = columnType.type + (columnType.primitiveKey ? ' PRIMARY KEY' : '');
        const sql = SQLBuilder.ddl().alterTableAddColumn(tableName, columnName, typeDef, columnType.comment);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    dropColumn(tableName: string, columnName: string): SqlResult {
        const sql = SQLBuilder.ddl().alterTableDropColumn(tableName, columnName);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    alterTableName(tableName: string, newTableName: string): SqlResult {
        const sql = SQLBuilder.ddl().alterTableRename(tableName, newTableName);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    alterTableComment(tableName: string, comment: string): SqlResult {
        const sql = SQLBuilder.ddl().alterTableComment(tableName, comment);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    alterColumnComment(tableName: string, columnName: string, comment: string): SqlResult {
        const tableIdx = this.executor.getTableIdxByName(tableName);
        if (tableIdx === undefined) {
            return {
                success: false,
                message: `Table ${tableName} not found`,
                data: 0,
                type: SqlType.DDL
            };
        }
        const sql = SQLBuilder.ddl().alterTableModifyColumnComment(tableName, columnName, 'STRING', comment);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    alterColumnName(tableName: string, columnName: string, newColumnName: string): SqlResult {
        const sql = SQLBuilder.ddl().alterTableRenameColumn(tableName, columnName, newColumnName);
        return this.executor.execute(sql, [SqlType.DDL]);
    }

    exportData(tableName: string): string {
        return this.executor.export(ExportFormat.INSERT_SQL, tableName);
    }

    exportDDL(tableName: string): string {
        return this.executor.export(ExportFormat.DDL, tableName);
    }

    getTables(): TableSchema[] {
        return this.executor.getTables();
    }
}
