export {};

import '../../../../../public/global';
import '../../../../global';

declare global {
    interface ExtensionSettings {
        [key: string]: unknown;
    }

    const SillyTavern: {
        getContext: () => {
            extensionSettings: Record<string, ExtensionSettings>;
            saveSettingsDebounced: () => void;
        };
    };
}
