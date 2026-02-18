import {ChatSqlExecutor, type SqlExecutor} from "./sql";
import {createAutoSaveProxy, ExtensionSettingManager} from "@/infra/extension-setting-manager.ts";

export class ChatMetaManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new ChatMetaManager();

    private _tableTemplateCache: SqlExecutor | null = null;

    private constructor() {
        const { chatMetadata } = SillyTavern.getContext();

        if (!chatMetadata[ChatMetaManager.MODULE_NAME]) {
            chatMetadata[ChatMetaManager.MODULE_NAME] = {
                tableTemplate: null
            };
        }
    }

    get tableTemplate() {
        if (!this._tableTemplateCache) {
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
        }
        return createAutoSaveProxy(this._tableTemplateCache, () => {
            SillyTavern.getContext().saveSettingsDebounced();
        });
    }

    set tableTemplate(v: SqlExecutor) {
        this._tableTemplateCache = new ChatSqlExecutor(v);
        SillyTavern.getContext().saveMetadata();
    }

    public static get instance(): ChatMetaManager {
        return ChatMetaManager._instance;
    }
}
