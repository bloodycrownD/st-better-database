import type {SqlExecutorService} from "@/service/interfaces/sql-executor-service.ts";
import {ExtensionSettingManager} from "@/infra/sillytarvern";
import {SqlType} from "@/infra/sql";

export class SystemSqlExecutorService implements SqlExecutorService {
    execute(sql: string): any {
        return ExtensionSettingManager.instance.systemSqlExecutor.execute(sql, [SqlType.DDL, SqlType.DML]);
    }
}
