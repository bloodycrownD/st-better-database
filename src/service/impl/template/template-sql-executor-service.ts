import type {SqlExecutorService} from "@/service/interfaces/sql-executor-service.ts";
import {type SqlResult, SqlType} from "@/infra/sql";
import {ExtensionSettingManager} from "@/infra/sillytarvern/persistent/extension-setting-manager.ts";

export class TemplateSqlExecutorService implements SqlExecutorService {
    execute(sql: string): SqlResult {
        return ExtensionSettingManager.instance.tableTemplate.execute(sql, [SqlType.DDL]);
    }
}
