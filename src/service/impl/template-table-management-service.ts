import {AbstractTableManagementService} from "@/service/abstract/abstract-table-management-service.ts";
import type {SqlExecutor} from "@/infra/sql";
import {ExtensionSettingManager} from "@/infra/extension-setting-manager.ts";

export class TemplateTableManagementService extends AbstractTableManagementService {
    getExecutor(): SqlExecutor {
        return ExtensionSettingManager.instance.tableTemplate;
    }
}
