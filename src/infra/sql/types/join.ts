import {JoinType} from '../enums/join-type';

/**
 * JOIN条件配置
 * 用于DQL查询中的表连接
 *
 * 当前仅支持简单的等值连接：leftTable.field = rightTable.field
 */
export interface JoinCondition {
    /** JOIN类型 */
    joinType: JoinType;
    /** 右表ID */
    rightTableIdx: number;
    /** 左表字段ID */
    leftFieldIdx: number;
    /** 右表字段ID */
    rightFieldIdx: number;
}
