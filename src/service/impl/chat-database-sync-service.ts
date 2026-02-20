import type {DatabaseSyncService} from "@/service/interfaces/database-sync-service.ts";
import {ChatMetaManager} from "@/infra/sillytarvern/persistent/chat-meta-manager.ts";
import {ExtensionSettingManager} from "@/infra/sillytarvern/persistent/extension-setting-manager.ts";

export class ChatDatabaseSyncService implements DatabaseSyncService {
    /**
     * 将当前聊天表的结构同步到模板中
     */
    pushTableToTemplate(): void {
        const template = ChatMetaManager.instance.tableTemplate;
        const target = ExtensionSettingManager.instance.tableTemplate;
        const serialized = template.serialize() as any;
        target.deserialize({structure: serialized.tableTemplate.structure});
    }

    /**
     * 将模板中的结构同步到当前聊天表中
     */
    syncTableFromTemplate(): void {
        ChatMetaManager.instance.tableTemplate = ExtensionSettingManager.instance.tableTemplate.clone();
    }
}
