import {SqlErrorCode} from '../enums/sql-error-code';

/**
 * SQL基础错误类
 * 所有SQL相关错误的基类
 */
export class SqlError extends Error {
    /** 错误代码 */
    code: SqlErrorCode;
    /** 错误在SQL中的位置（字符索引，可选） */
    position?: number;
    /** 原始SQL语句（可选） */
    sql?: string;

    constructor(code: SqlErrorCode, message: string, position?: number, sql?: string) {
        super(message);
        this.name = 'SqlError';
        this.code = code;
        this.position = position;
        this.sql = sql;
    }
}
