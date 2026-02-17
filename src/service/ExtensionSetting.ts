class Config {
    enabled = false;
}

export class SettingsManager {
    static readonly MODULE_NAME = 'ST_BETTER_DATABASE';

    private static readonly _instance = new SettingsManager();

    private readonly settings = new Config();

    private constructor() {
        const {extensionSettings} = SillyTavern.getContext();

        if (!extensionSettings[SettingsManager.MODULE_NAME]) {
            extensionSettings[SettingsManager.MODULE_NAME] = structuredClone(this.settings);
        }

        const moduleSettings = extensionSettings[SettingsManager.MODULE_NAME]!;

        for (const key of Object.keys(this.settings)) {
            if (!Object.prototype.hasOwnProperty.call(moduleSettings, key)) {
                moduleSettings[key] = this.settings[key as keyof typeof this.settings];
            }
        }

        this.settings = moduleSettings as typeof this.settings;
    }

    get enabled() {
        return this.settings.enabled;
    }

    set enabled(v: boolean) {
        this.settings.enabled = v;
        SillyTavern.getContext().saveSettingsDebounced();
    }

    public static get instance(): SettingsManager {
        return SettingsManager._instance;
    }
}
