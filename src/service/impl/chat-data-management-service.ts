import {AbstractDataManagementService} from "@/service/abstract/abstract-data-management-service.ts";
import type {SqlExecutor} from "@/infra/sql";
import {ChatMetaManager} from "@/infra/chat-meta-manager.ts";

export class ChatDataManagementService extends AbstractDataManagementService {
    getExecutor(): SqlExecutor {
        // 使用模板数据库，数据操作不影响模板
        return ChatMetaManager.instance.tableTemplate.clone();
    }
}
