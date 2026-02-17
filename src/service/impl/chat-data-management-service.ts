import {AbstractDataManagementService} from "@/service/abstract/abstract-data-management-service.ts";
import type {SqlExecutor} from "@/infra/sql";
import {ChatDataManager} from "@/infra/sillytarvern/chat-data-manager.ts";

export class ChatDataManagementService extends AbstractDataManagementService {
    get executor(): SqlExecutor {
        // 使用模板数据库，数据操作不影响模板
        return ChatDataManager.executor;
    }
}
