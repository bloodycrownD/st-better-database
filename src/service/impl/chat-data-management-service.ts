import {AbstractDataManagementService} from "@/service/abstract/abstract-data-management-service.ts";
import {type Row, type SqlExecutor, SqlType} from "@/infra/sql";
import {ChatMetaManager} from "@/infra/chat-meta-manager.ts";
import {ChatMessageManager} from "@/infra/sillytarvern/chat-message-manager.ts";

export class ChatDataManagementService extends AbstractDataManagementService {
    get executor(): SqlExecutor {
        // 使用模板数据库，数据操作不影响模板
        const executor = ChatMetaManager.instance.tableTemplate.clone();
        const rows:Row[] = ChatMessageManager.getRows();
        if (rows.length > 0) {
            executor.execute(executor.row2dml(rows), [SqlType.DML])
        }
        return executor;
    }
}
