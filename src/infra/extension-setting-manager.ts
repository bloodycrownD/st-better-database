import {DatabaseBuilder, type SqlExecutor} from "./sql";

class Config {
    tableTemplate:SqlExecutor = DatabaseBuilder.newExecutor();
}

export class ExtensionSettingManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new ExtensionSettingManager();

    private readonly settings = new Config();

    private constructor() {
        const {extensionSettings} = SillyTavern.getContext();

        if (!extensionSettings[ExtensionSettingManager.MODULE_NAME]) {
            extensionSettings[ExtensionSettingManager.MODULE_NAME] = structuredClone(this.settings);
        }

        const moduleSettings = extensionSettings[ExtensionSettingManager.MODULE_NAME]!;

        for (const key of Object.keys(this.settings)) {
            if (!Object.prototype.hasOwnProperty.call(moduleSettings, key)) {
                moduleSettings[key] = this.settings[key as keyof typeof this.settings];
            }
        }

        this.settings = moduleSettings as typeof this.settings;
    }

    get tableTemplate() {
        return this.settings.tableTemplate;
    }

    set tableTemplate(v: SqlExecutor) {
        v.setDataStorage(DatabaseBuilder.newStorage());
        this.settings.tableTemplate = v;
        SillyTavern.getContext().saveSettingsDebounced();
    }

    public static get instance(): ExtensionSettingManager {
        return ExtensionSettingManager._instance;
    }
}
