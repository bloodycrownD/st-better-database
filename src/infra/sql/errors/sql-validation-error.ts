import {SqlError} from './sql-error';
import {SqlErrorCode} from '../enums/sql-error-code';

/**
 * 验证错误
 * 数据不符合约束或类型要求时抛出
 */
export class SqlValidationError extends SqlError {
    constructor(message: string, sql?: string) {
        super(SqlErrorCode.VALIDATION_ERROR, message, undefined, sql);
        this.name = 'SqlValidationError';
    }
}
