import {SqlError} from './sql-error';
import {SqlErrorCode} from '../enums/sql-error-code';

/**
 * 语法错误
 * SQL语句解析失败时抛出
 */
export class SqlSyntaxError extends SqlError {
    constructor(message: string, position?: number, sql?: string) {
        super(SqlErrorCode.SYNTAX_ERROR, message, position, sql);
        this.name = 'SqlSyntaxError';
    }
}
