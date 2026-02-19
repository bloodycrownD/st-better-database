import type {TableSchema} from './table';

/**
 * SQL执行器的核心数据结构
 * 包含所有表结构和映射关系
 *
 * 设计说明：
 * - 使用普通对象（Record）而非Map，支持自动JSON序列化
 * - 支持Vue 3的响应式追踪
 * - 所有字段都是可序列化的原始类型
 */
export type ExecutorStructure = {
    /** 表结构映射：表ID -> 表结构 */
    tableSchemas: Record<number, TableSchema>;
    /** 表名到表ID的映射：表名 -> 表ID */
    tableName2Idx: Record<string, number>;
    /** 表ID计数器，用于分配新表ID */
    tableIdxCounter: number;
};
