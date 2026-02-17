/**
 * 核心类型定义
 */

/**
 * SQL支持的数据值类型
 * 所有SQL操作中的值都必须是这三种类型之一
 */
export type SqlValue = number | string | null;

/**
 * 行数据快照
 * 使用Map存储一行数据，key为字段ID，value为字段值
 *
 * 示例：{0: '张三', 1: 25} 表示id为0的字段值为'张三'，id为1的字段值为25
 */
export type RowData = Map<number, SqlValue>;
