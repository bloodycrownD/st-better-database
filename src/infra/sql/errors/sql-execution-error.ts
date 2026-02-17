import {SqlError} from './sql-error';
import {SqlErrorCode} from '../enums/sql-error-code';

/**
 * 执行错误
 * SQL执行过程中发生异常时抛出
 */
export class SqlExecutionError extends SqlError {
    constructor(message: string, sql?: string) {
        super(SqlErrorCode.EXECUTION_ERROR, message, undefined, sql);
        this.name = 'SqlExecutionError';
    }
}
