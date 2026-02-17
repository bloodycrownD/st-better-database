import type {SqlExecutorService} from "@/service/interfaces/sql-executor-service.ts";
import {type SqlResult, SqlType} from "@/infra/sql";
import {ChatDataManager} from "@/infra/sillytarvern/chat-data-manager.ts";

export class ChatSqlExecutorService implements SqlExecutorService {
    execute(sql: string): SqlResult {
        return ChatDataManager.executor.execute(sql, [SqlType.DDL]);
    }
}
