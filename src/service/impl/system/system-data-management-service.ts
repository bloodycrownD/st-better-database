import {AbstractDataManagementService} from "@/service/abstract/abstract-data-management-service.ts";
import {ExtensionSettingManager, type SqlExecutor} from "@/infra/sql";

export class SystemDataManagementService extends AbstractDataManagementService{
    get executor(): SqlExecutor {
        return ExtensionSettingManager.instance.systemSqlExecutor;
    }

}
