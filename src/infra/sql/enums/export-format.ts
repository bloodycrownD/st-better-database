/**
 * 导出格式枚举
 * 定义数据导出支持的格式
 */
export enum ExportFormat {
    /** INSERT语句格式 */
    INSERT_SQL = 'INSERT_SQL',
    /** Row JSON格式 */
    ROW_JSON = 'ROW_JSON',
    /** 表结构定义 */
    TABLE_SCHEMA = 'TABLE_SCHEMA',
    /** DDL语句格式 */
    DDL = 'DDL',
    /** MARKDOWN 格式 */
    MARKDOWN = 'MARKDOWN',
    /** 标准数据格式: Record<string, Record<string, SqlValue>[]> */
    STANDARD_DATA = 'STANDARD_DATA',
}
