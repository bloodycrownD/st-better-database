/**
 * JOIN类型枚举
 * 支持简单的单key equal join
 */
export enum JoinType {
    /** 内连接，只返回匹配的行 */
    INNER = 'INNER',
    /** 左连接，返回左表所有行，右表不匹配则为null */
    LEFT = 'LEFT'
}
