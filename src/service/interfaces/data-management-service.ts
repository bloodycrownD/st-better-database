import type {SqlResult, SqlValue} from '../../infra/sql';
import type {Where} from '../../infra/sql';

export interface DataManagementService {

    queryData(tableName: string, where?: Where): SqlResult;

    insertData(tableName: string, data: Map<string, SqlValue> | Map<string, SqlValue>[]): SqlResult;

    deleteData(tableName: string, where: Where): SqlResult;
}
