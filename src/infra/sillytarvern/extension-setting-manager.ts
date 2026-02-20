import {DatabaseBuilder, type SqlExecutor} from "../sql";

interface ExtensionSettings {
    [key: string]: unknown;
    tableTemplate: any;
    chatStatusBarSwitch: boolean;
    chatStatusBarCode: string;
    extensionSwitch: boolean;
    systemSqlExecutor: any;
}

/**
 * 创建自动保存代理，拦截 execute 方法以实现自动持久化
 */
export function createAutoSaveProxy(executor: SqlExecutor, onSave: () => void): SqlExecutor {
    return new Proxy(executor, {
        get(target, prop) {
            const value = (target as any)[prop];
            if (typeof value === 'function' && prop === 'execute') {
                return function (...args: any[]) {
                    const result = value.apply(target, args);
                    onSave();
                    return result;
                };
            }
            return value;
        }
    });
}

/**
 * ExtensionSettingManager 管理 SillyTavern 扩展级别的设置持久化
 *
 * 设计说明：
 * - 使用立即初始化（eager initialization）：static readonly _instance = new ExtensionSettingManager()
 * - 原因：extensionSettings 在扩展加载时就已经可用，不存在时序问题
 * - chatMetadata 与 extensionSettings 不同：后者在全局层面，前者在聊天层面
 */
export class ExtensionSettingManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new ExtensionSettingManager();

    private _tableTemplateCache: SqlExecutor | null = null;
    private _tableTemplateProxy: SqlExecutor | null = null;

    private _chatStatusBarSwitch: boolean = false;
    private _chatStatusBarCode: string = '';
    private _extensionSwitch: boolean = false;
    private _systemSqlExecutorCache: SqlExecutor | null = null;
    private _systemSqlExecutorProxy: SqlExecutor | null = null;

    private constructor() {
        const {extensionSettings} = SillyTavern.getContext();

        if (!extensionSettings[ExtensionSettingManager.MODULE_NAME]) {
            extensionSettings[ExtensionSettingManager.MODULE_NAME] = {
                tableTemplate: null,
                chatStatusBarSwitch: false,
                chatStatusBarCode: '',
                extensionSwitch: false,
                systemSqlExecutor: null
            };
        }

        this._loadFromSettings();
    }

    private _loadFromSettings(): void {
        const {extensionSettings} = SillyTavern.getContext();
        const settings = extensionSettings[ExtensionSettingManager.MODULE_NAME] as ExtensionSettings | undefined;

        if (settings) {
            if (settings.tableTemplate) {
                try {
                    this._tableTemplateCache = DatabaseBuilder.newExecutor();
                    this._tableTemplateCache.deserialize(settings.tableTemplate);
                } catch (e) {
                    this._tableTemplateCache = null;
                }
            }

            this._chatStatusBarSwitch = settings.chatStatusBarSwitch ?? false;
            this._chatStatusBarCode = settings.chatStatusBarCode ?? '';
            this._extensionSwitch = settings.extensionSwitch ?? false;

            if (settings.systemSqlExecutor) {
                try {
                    this._systemSqlExecutorCache = DatabaseBuilder.newExecutor();
                    this._systemSqlExecutorCache.deserialize(settings.systemSqlExecutor);
                } catch (e) {
                    this._systemSqlExecutorCache = null;
                }
            }
        }
    }

    private _saveToSettings(): void {
        const {extensionSettings} = SillyTavern.getContext();
        let settings = extensionSettings[ExtensionSettingManager.MODULE_NAME] as ExtensionSettings | undefined;

        if (!settings) {
            settings = {
                tableTemplate: null,
                chatStatusBarSwitch: false,
                chatStatusBarCode: '',
                extensionSwitch: false,
                systemSqlExecutor: null
            };
            extensionSettings[ExtensionSettingManager.MODULE_NAME] = settings;
        }

        settings.tableTemplate = this._tableTemplateCache?.serialize();
        settings.chatStatusBarSwitch = this._chatStatusBarSwitch;
        settings.chatStatusBarCode = this._chatStatusBarCode;
        settings.extensionSwitch = this._extensionSwitch;
        settings.systemSqlExecutor = this._systemSqlExecutorCache?.serialize();

        SillyTavern.getContext().saveSettingsDebounced();
    }

    get tableTemplate(): SqlExecutor {
        if (!this._tableTemplateCache) {
            this._tableTemplateCache = DatabaseBuilder.newExecutor();
        }

        if (!this._tableTemplateProxy) {
            this._tableTemplateProxy = createAutoSaveProxy(this._tableTemplateCache, () => this._saveToSettings());
        }

        return this._tableTemplateProxy;
    }

    set tableTemplate(v: SqlExecutor | object) {
        if (typeof v === 'object' && 'serialize' in v) {
            const serialized = (v as any).serialize();
            this._tableTemplateCache = DatabaseBuilder.newExecutor();
            this._tableTemplateCache.deserialize(serialized);
        } else {
            this._tableTemplateCache = v as SqlExecutor;
        }

        this._tableTemplateProxy = null;
        this._saveToSettings();
    }

    get chatStatusBarSwitch(): boolean {
        return this._chatStatusBarSwitch;
    }

    set chatStatusBarSwitch(v: boolean) {
        this._chatStatusBarSwitch = v;
        this._saveToSettings();
    }

    get chatStatusBarCode(): string {
        return this._chatStatusBarCode;
    }

    set chatStatusBarCode(v: string) {
        this._chatStatusBarCode = v;
        this._saveToSettings();
    }

    get extensionSwitch(): boolean {
        return this._extensionSwitch;
    }

    set extensionSwitch(v: boolean) {
        this._extensionSwitch = v;
        this._saveToSettings();
    }

    get systemSqlExecutor(): SqlExecutor {
        if (!this._systemSqlExecutorCache) {
            this._systemSqlExecutorCache = DatabaseBuilder.newExecutor();
        }

        if (!this._systemSqlExecutorProxy) {
            this._systemSqlExecutorProxy = createAutoSaveProxy(this._systemSqlExecutorCache, () => this._saveToSettings());
        }

        return this._systemSqlExecutorProxy;
    }

    set systemSqlExecutor(v: SqlExecutor | object) {
        if (typeof v === 'object' && 'serialize' in v) {
            const serialized = (v as any).serialize();
            this._systemSqlExecutorCache = DatabaseBuilder.newExecutor();
            this._systemSqlExecutorCache.deserialize(serialized);
        } else {
            this._systemSqlExecutorCache = v as SqlExecutor;
        }

        this._systemSqlExecutorProxy = null;
        this._saveToSettings();
    }

    public static get instance(): ExtensionSettingManager {
        return ExtensionSettingManager._instance;
    }
}

