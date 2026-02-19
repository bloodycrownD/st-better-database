import type {ColumnSchema} from './field';

/**
 * 表结构定义
 * 使用数字ID映射表名和字段名，实现表结构变更时的数据隔离
 *
 * 设计原理：
 * - tableName: 逻辑表名，可被修改而不影响数据
 * - id2fieldName: 字段ID到字段名的映射，字段重命名不影响数据
 * - fieldName2id: 字段名到字段ID的反向映射，用于快速查找
 * - columnSchemas: 字段ID到字段详细定义的映射，包含类型、约束等信息
 * - counter: 字段ID计数器，用于生成新字段ID
 */
export type TableSchema = {
    /** 表名 */
    tableName: string;
    /** 字段映射：字段ID -> 字段名 */
    id2fieldName: Record<number, string>;
    /** 字段名到字段ID的反向映射：字段名 -> 字段ID */
    fieldName2id: Record<string, number>;
    /** 字段详细定义：字段ID -> 字段完整元数据（类型、约束、默认值） */
    columnSchemas: Record<number, ColumnSchema>;
    /** 字段ID计数器，用于分配新字段ID */
    counter: number;
    /** 表注释 */
    comment?: string;
}
