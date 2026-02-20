import type {DataStorage, Row, SqlResult, TableSchema} from '@/infra/sql';
import {ExportFormat, SqlType} from '../../index';

/**
 * SQL执行器接口
 *
 * 职责：
 * 1. 管理表结构映射（tableIdx -> TableSchema）
 * 2. 解析和执行SQL语句
 * 3. 管理DataStorage的读写
 * 4. 提供数据导出和格式转换功能
 */
export interface SqlExecutor {
    /**
     * 执行SQL语句
     *
     * 功能说明：
     * - 支持多条SQL语句，用分号';'分隔
     * - 根据sqlTypes参数校验SQL类型，类型不匹配会报错
     * - 支持混合类型执行，如[SqlType.DQL, SqlType.DML]
     *
     * 使用示例：
     * ```typescript
     * // DDL操作
     * executor.execute('CREATE TABLE users...', [SqlType.DDL]);
     *
     * // DML操作
     * executor.execute('INSERT INTO users...', [SqlType.DML]);
     *
     * // DQL操作
     * executor.execute('SELECT * FROM users', [SqlType.DQL]);
     *
     * // 混合执行
     * executor.execute(sql, [SqlType.DQL, SqlType.DML, SqlType.DDL]);
     *
     * // Row格式操作
     * executor.execute(rowJson, [SqlType.ROW]);
     * ```
     *
     * @param sql 要执行的SQL语句或Row格式的JSON字符串
     * @param sqlTypes 允许的SQL类型数组
     * @returns SQL执行结果
     * @throws SqlSyntaxError 语法错误时抛出
     * @throws SqlValidationError 数据验证失败时抛出
     * @throws SqlExecutionError 执行异常时抛出
     */
    execute(sql: string, sqlTypes: SqlType[]): SqlResult;

    /**
     * 获取当前数据存储
     * @returns 当前使用的DataStorage实例
     */
    getDataStorage(): DataStorage;

    /**
     * 设置数据存储
     * 用于切换数据快照或清空数据
     *
     * @param dataStorage 新的DataStorage实例
     */
    setDataStorage(dataStorage: DataStorage): void;

    /**
     * 导出数据
     *
     * 支持多种格式导出：
     * - INSERT_SQL: 导出为INSERT SQL语句
     * - ROW_JSON: 导出为Row格式JSON
     * - TABLE_SCHEMA: 导出表结构定义
     *
     * @param format 导出格式
     * @param table 可选，指定要导出的表名，不传则导出所有表
     * @returns 导出结果字符串
     */
    export(format: ExportFormat, table?: string): string;

    /**
     * 将DML语句转换为Row格式
     *
     * 将INSERT/UPDATE/DELETE/APPEND语句解析为Row对象数组
     * 支持多条SQL语句，用分号';'分隔
     *
     * 转换示例：
     * ```
     * INSERT INTO users (name, age) VALUES ('张三', 25);
     * ↓
     * [{action: "insert", tableIdx: 0, after: {1: "张三", 2: 25}}]
     * ```
     *
     * @param sql DML语句字符串，多条用';'分隔
     * @returns Row对象数组
     */
    dml2row(sql: string): Row[];

    /**
     * 将Row格式转换为DML语句
     *
     * 将Row对象数组转换回INSERT/UPDATE/DELETE/APPEND语句
     * 支持批量转换
     *
     * 转换示例：
     * ```
     * [{action: "insert", tableIdx: 0, after: {1: "张三"}}]
     * ↓
     * INSERT INTO users (name) VALUES ('张三');
     * ```
     *
     * @param rows Row对象数组
     * @returns DML语句字符串，多条用';'分隔
     */
    row2dml(rows: Row[]): string;

    /**
     * 根据表名获取表ID
     * @param tableName 表名
     * @returns 表ID，不存在返回undefined
     */
    getTableIdxByName(tableName: string): number | undefined;

    /**
     * 获取表ID对应的表名
     * @param tableIdx 表ID
     * @returns 表名，不存在返回undefined
     */
    getTableNameByIdx(tableIdx: number): string | undefined;

    getTables(): TableSchema[];

    /**
     * 克隆执行器
     * 创建当前执行器的深拷贝，只复制表结构映射
     *
     * @returns 新的SqlExecutor实例
     */
    clone(): SqlExecutor;

    /**
     * 序列化执行器
     * 将表结构和数据转换为JSON对象，用于持久化或传输
     * @returns JSON对象
     */
    serialize(): object;

    /**
     * 反序列化执行器
     * 从JSON对象恢复表结构和数据
     * @param data 序列化的JSON对象
     */
    deserialize(data: object): void;

}
