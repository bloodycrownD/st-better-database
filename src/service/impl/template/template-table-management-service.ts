import {AbstractTableManagementService} from "@/service/abstract/abstract-table-management-service.ts";
import type {SqlExecutor} from "@/infra/sql";
import {ExtensionSettingManager} from "@/infra/sillytarvern/persistent/extension-setting-manager.ts";

export class TemplateTableManagementService extends AbstractTableManagementService {
    get executor(): SqlExecutor {
        return ExtensionSettingManager.instance.tableTemplate;
    }
}
