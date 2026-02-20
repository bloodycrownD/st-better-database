import {AbstractTableManagementService} from "@/service/abstract/abstract-table-management-service.ts";
import type {SqlExecutor} from "@/infra/sql";
import {ChatMetaManager} from "@/infra/sillytarvern/chat-meta-manager.ts";

export class ChatTableManagementService extends AbstractTableManagementService {
    get executor(): SqlExecutor {
        //返回的是ChatMeta的tableTemplate本体，不是clone，所以操作会改变ChatMeta的tableTemplate
        return ChatMetaManager.instance.tableTemplate;
    }
}
