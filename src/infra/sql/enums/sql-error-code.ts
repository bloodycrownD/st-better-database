/**
 * SQL错误代码枚举
 * 用于错误分类和处理
 */
export enum SqlErrorCode {
    /** 语法错误：SQL语句格式不正确 */
    SYNTAX_ERROR = 'SYNTAX_ERROR',
    /** 验证错误：数据不符合约束或类型要求 */
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    /** 执行错误：执行过程中发生异常 */
    EXECUTION_ERROR = 'EXECUTION_ERROR',
    /** 表不存在 */
    TABLE_NOT_FOUND = 'TABLE_NOT_FOUND',
    /** 字段不存在 */
    COLUMN_NOT_FOUND = 'COLUMN_NOT_FOUND',
    /** 类型不匹配 */
    TYPE_MISMATCH = 'TYPE_MISMATCH'
}
