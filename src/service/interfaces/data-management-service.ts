import type {SqlResult, SqlValue} from '@/infra/sql';
import type {Where} from '@/infra/sql';

export interface DataManagementService {

    /**
     * 查询表数据
     * @param tableName 表名
     * @param where 查询条件
     * @returns 查询结果
     */
    queryData(tableName: string, where?: Where): SqlResult;

    /**
     * 插入数据到表
     * @param tableName 表名
     * @param data 单条数据或多条数据
     * @returns 插入结果
     */
    insertData(tableName: string, data: Map<string, SqlValue> | Map<string, SqlValue>[]): SqlResult;

    /**
     * 删除表数据
     * @param tableName 表名
     * @param where 删除条件
     * @returns 删除结果
     */
    deleteData(tableName: string, where: Where): SqlResult;

    /**
     * 导出表数据，insert sql
     * @param tableName 表名
     * @returns INSERT SQL语句
     */
    export(tableName: string): string;
}
