import {ChatSqlExecutor, type SqlExecutor} from "./sql";
import {createAutoSaveProxy, ExtensionSettingManager} from "@/infra/extension-setting-manager.ts";

export class ChatMetaManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new ChatMetaManager();

    private _tableTemplateCache: SqlExecutor | null = null;
    private _tableTemplateProxy: SqlExecutor | null = null;

    private constructor() {
        const { chatMetadata } = SillyTavern.getContext();

        if (!chatMetadata[ChatMetaManager.MODULE_NAME]) {
            chatMetadata[ChatMetaManager.MODULE_NAME] = {
                tableTemplate: null
            };
        }

        this._loadFromMetadata();
    }

    private _loadFromMetadata(): void {
        const { chatMetadata } = SillyTavern.getContext();
        const settings = chatMetadata[ChatMetaManager.MODULE_NAME];

        if (settings && settings.tableTemplate) {
            try {
                const template = ExtensionSettingManager.instance.tableTemplate;
                this._tableTemplateCache = new ChatSqlExecutor(template);
                this._tableTemplateCache.deserialize(settings.tableTemplate);
            } catch (e) {
                console.error('Failed to deserialize tableTemplate from metadata:', e);
                this._tableTemplateCache = null;
            }
        }
    }

    private _saveToMetadata(): void {
        const { chatMetadata } = SillyTavern.getContext();
        chatMetadata[ChatMetaManager.MODULE_NAME].tableTemplate = this._tableTemplateCache?.serialize();
        SillyTavern.getContext().saveMetadata();
    }

    get tableTemplate(): SqlExecutor {
        if (!this._tableTemplateCache) {
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
        }

        if (!this._tableTemplateProxy) {
            this._tableTemplateProxy = createAutoSaveProxy(this._tableTemplateCache, () => {
                this._saveToMetadata();
            });
        }

        return this._tableTemplateProxy;
    }

    set tableTemplate(v: SqlExecutor | object) {
        if (typeof v === 'object' && 'serialize' in v) {
            const serialized = (v as any).serialize();
            const template = ExtensionSettingManager.instance.tableTemplate;
            this._tableTemplateCache = new ChatSqlExecutor(template);
            this._tableTemplateCache.deserialize(serialized);
        } else {
            this._tableTemplateCache = new ChatSqlExecutor(v as SqlExecutor);
        }

        this._tableTemplateProxy = null;
        this._saveToMetadata();
    }

    public static get instance(): ChatMetaManager {
        return ChatMetaManager._instance;
    }
}
