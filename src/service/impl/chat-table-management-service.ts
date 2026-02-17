import {AbstractTableManagementService} from "@/service/abstract/abstract-table-management-service.ts";
import type {SqlExecutor} from "@/infra/sql";
import {ChatMetaManager} from "@/infra/chat-meta-manager.ts";

export class ChatTableManagementService extends AbstractTableManagementService {
    getExecutor(): SqlExecutor {
        return ChatMetaManager.instance.tableTemplate;
    }
}
