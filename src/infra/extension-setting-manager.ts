import {DatabaseBuilder, type SqlExecutor} from "./sql";

export function createAutoSaveProxy(executor: SqlExecutor, onSave: () => void): SqlExecutor {
    return new Proxy(executor, {
        get(target, prop) {
            const value = (target as any)[prop];
            if (typeof value === 'function' &&prop === 'execute') {
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

export class ExtensionSettingManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new ExtensionSettingManager();

    private _tableTemplateCache: SqlExecutor | null = null;

    private constructor() {
        const {extensionSettings} = SillyTavern.getContext();

        if (!extensionSettings[ExtensionSettingManager.MODULE_NAME]) {
            extensionSettings[ExtensionSettingManager.MODULE_NAME] = {
                tableTemplate: null
            };
        }
    }

    get tableTemplate() {
        if (!this._tableTemplateCache) {
            this._tableTemplateCache = DatabaseBuilder.newExecutor();
        }
        return createAutoSaveProxy(this._tableTemplateCache, () => {
            SillyTavern.getContext().saveSettingsDebounced();
        });
    }

    set tableTemplate(v: SqlExecutor) {
        v.setDataStorage(DatabaseBuilder.newStorage());
        this._tableTemplateCache = v;
        SillyTavern.getContext().saveSettingsDebounced();
    }

    public static get instance(): ExtensionSettingManager {
        return ExtensionSettingManager._instance;
    }
}
