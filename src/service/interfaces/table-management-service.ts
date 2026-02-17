import type {ColumnSchema, SqlResult, TableSchema} from "../../infra/sql";

export interface TableManagementService {

    /**
     * 创建表
     * @param tableName 表名
     * @param columns 列定义
     * @returns 创建结果
     */
    createTable(tableName: string, columns: Array<ColumnSchema>): SqlResult;

    /**
     * 删除表
     * @param tableName 表名
     * @returns 删除结果
     */
    dropTable(tableName: string): SqlResult;

    /**
     * 添加列
     * @param tableName 表名
     * @param columnName 列名
     * @param columnType 列类型
     * @returns 添加结果
     */
    addColumn(tableName: string, columnName: string, columnType: ColumnSchema): SqlResult;

    /**
     * 修改列名
     * @param tableName
     * @param columnName
     * @param newColumnName
     */
    alterColumnName(tableName: string, columnName: string, newColumnName: string): SqlResult;

    /**
     * 修改列注释
     * @param tableName
     * @param columnName
     * @param comment
     */
    alterColumnComment(tableName: string, columnName: string, comment: string): SqlResult;
    /**
     * 删除列
     * @param tableName 表名
     * @param columnName 列名
     * @returns 删除结果
     */
    dropColumn(tableName: string, columnName: string): SqlResult;

    /**
     * 修改表名
     * @param tableName
     * @param newTableName
     */
    alterTableName(tableName: string, newTableName: string): SqlResult;

    /**
     * 修改表注释
     * @param tableName
     * @param comment
     */
    alterTableComment(tableName: string, comment: string): SqlResult;
    /**
     * 导出建表语句
     * @param tableName 表名
     * @returns CREATE TABLE SQL语句
     */
    export(tableName: string): string;

    /**
     * 获取所有表
     * @returns 表结构信息
     */
    getTables(): TableSchema;
}
