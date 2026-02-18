import type {SqlExecutorService} from "@/service/interfaces/sql-executor-service.ts";
import {type SqlResult, SqlType} from "@/infra/sql";
import {ChatMetaManager} from "@/infra/chat-meta-manager.ts";

export class ChatSqlExecutorService implements SqlExecutorService {
    execute(sql: string): SqlResult {
        return ChatMetaManager.instance.tableTemplate.execute(sql, [SqlType.DDL]);
    }
}
