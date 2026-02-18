import {ChatSqlExecutor, type SqlExecutor} from "./sql";
import {createAutoSaveProxy, ExtensionSettingManager} from "@/infra/extension-setting-manager.ts";

class Config {
    // 默认是模板数据库
    tableTemplate: SqlExecutor = new ChatSqlExecutor(ExtensionSettingManager.instance.tableTemplate);
}

export class ChatMetaManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new ChatMetaManager();

    private readonly defaultSettings = new Config();

    private constructor() {}

    private getMetadata() {
        const { chatMetadata } = SillyTavern.getContext();

        if (!chatMetadata[ChatMetaManager.MODULE_NAME]) {
            chatMetadata[ChatMetaManager.MODULE_NAME] = structuredClone(this.defaultSettings);
        }

        const moduleMetadata = chatMetadata[ChatMetaManager.MODULE_NAME]!;

        for (const key of Object.keys(this.defaultSettings)) {
            if (!Object.prototype.hasOwnProperty.call(moduleMetadata, key)) {
                moduleMetadata[key] = this.defaultSettings[key as keyof typeof this.defaultSettings];
            }
        }

        return moduleMetadata as typeof this.defaultSettings;
    }

    get tableTemplate() {
        return createAutoSaveProxy(this.getMetadata().tableTemplate, () => {
            SillyTavern.getContext().saveSettingsDebounced();
        });
    }

    set tableTemplate(v: SqlExecutor) {
        //清空数据
        const metadata = this.getMetadata();
        metadata.tableTemplate = new ChatSqlExecutor(v);
        SillyTavern.getContext().saveMetadata();
    }

    public static get instance(): ChatMetaManager {
        return ChatMetaManager._instance;
    }
}
