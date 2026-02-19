export {};

declare global {
  var SillyTavern: {
    getContext: () => {
      extensionSettings: Record<string, unknown>;
      saveSettingsDebounced: () => void;
    };
  };
}

global.SillyTavern = {
  getContext: () => ({
    extensionSettings: {},
    saveSettingsDebounced: () => {}
  })
};
