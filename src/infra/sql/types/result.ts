import type {SqlValue} from './core';
import {SqlType} from '../enums/sql-type';

/**
 * SQL执行结果
 * 统一所有SQL操作的返回格式
 */
export type SqlResult = {
    /** 是否执行成功 */
    success: boolean;
    /** 结果消息，成功时为提示信息，失败时为错误描述 */
    message: string;
    /**
     * 返回数据：
     * - DQL: 查询结果数组，每个元素是字段名到值的Record
     * - DML/ROW: 受影响的行数
     * - DDL: 0
     */
    data: Array<Record<string, SqlValue>> | number;
    /** SQL类型 */
    type: SqlType;
}
