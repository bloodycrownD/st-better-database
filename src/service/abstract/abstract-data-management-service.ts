import {ExportFormat, SQLBuilder, type SqlExecutor, type SqlResult, SqlType, type SqlValue, Where} from "@/infra/sql";
import type {DataManagementService} from "@/service/interfaces/data-management-service.ts";

export abstract class AbstractDataManagementService implements DataManagementService {

    abstract get executor(): SqlExecutor;

    queryData(tableName: string, where?: Where): SqlResult {
        const sql = SQLBuilder.select()
            .from(tableName)
            .where(where || Where.of())
            .build();
        return this.executor.execute(sql, [SqlType.DQL]);
    }

    insertData(tableName: string, data: Map<string, SqlValue> | Map<string, SqlValue>[]): SqlResult {
        const insert = SQLBuilder.insert().into(tableName);
        if (Array.isArray(data)) {
            insert.batch(data);
        } else {
            insert.setValues(data);
        }
        const sql = insert.build();
        return this.executor.execute(sql, [SqlType.DML]);
    }

    deleteData(tableName: string, where: Where): SqlResult {
        const sql = SQLBuilder.delete()
            .from(tableName)
            .where(where)
            .build();
        return this.executor.execute(sql, [SqlType.DML]);
    }

    updateData(tableName: string, data: Map<string, SqlValue>, where: Where): SqlResult {
        const sql = SQLBuilder.update()
            .table(tableName)
            .setValues(data)
            .where(where)
            .build();
        return this.executor.execute(sql, [SqlType.DML]);
    }

    export(tableName: string): string {
        return this.executor.export(ExportFormat.INSERT_SQL, tableName);
    }
}
