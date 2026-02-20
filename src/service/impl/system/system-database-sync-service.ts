import type {DatabaseSyncService} from "@/service/interfaces/database-sync-service.ts";
import {ExtensionSettingManager} from "@/infra/sillytarvern";

export class SystemDatabaseSyncService implements DatabaseSyncService {
    syncTableFromTemplate(): void {
        ExtensionSettingManager.instance.systemSqlExecutor = ExtensionSettingManager.instance.tableTemplate.clone();
    }

    pushTableToTemplate(): void {
        const template = ExtensionSettingManager.instance.systemSqlExecutor;
        const target = ExtensionSettingManager.instance.tableTemplate;
        const serialized = template.serialize() as any;
        target.deserialize({structure: serialized.tableTemplate.structure});
    }
}
