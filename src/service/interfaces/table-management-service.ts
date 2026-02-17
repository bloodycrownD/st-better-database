import type {ColumnSchema, SqlResult, TableSchema} from "../../infra/sql";

export interface TableManagementService {

    createTable(tableName: string, columns: Array<ColumnSchema>): SqlResult;

    dropTable(tableName: string): SqlResult;

    addColumn(tableName: string, columnName: string, columnType: ColumnSchema): SqlResult;

    renameColumn(tableName: string, columnName: string): SqlResult;

    dropColumn(tableName: string, columnName: string): SqlResult;

    renameTable(tableName: string, newTableName: string): SqlResult;

    getTables(): TableSchema;
}
