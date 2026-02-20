import {AbstractTableManagementService} from "@/service/abstract/abstract-table-management-service.ts";
import {ExtensionSettingManager, type SqlExecutor} from "@/infra/sql";

export class SystemTableManagementService extends AbstractTableManagementService {
    get executor(): SqlExecutor {
        return ExtensionSettingManager.instance.systemSqlExecutor;
    }

}
