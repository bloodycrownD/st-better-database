import {AbstractDataManagementService} from "@/service/abstract/abstract-data-management-service.ts";
import {type SqlExecutor} from "@/infra/sql";
import {ChatMetaManager} from "@/infra/sillytarvern/chat-meta-manager.ts";

export class ChatDataManagementService extends AbstractDataManagementService {
    get executor(): SqlExecutor {
        return ChatMetaManager.instance.tableTemplate;
    }
}
