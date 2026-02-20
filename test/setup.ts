import './global.d.ts';

(global as any).SillyTavern = {
  getContext: () => ({
    extensionSettings: {},
    saveSettingsDebounced: () => {},
    chat: [],
    saveChat: () => {},
    chatMetadata: {},
    saveMetadata: () => {},
    eventSource: {
      on: () => {}
    },
    event_types: {
      MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
      MESSAGE_EDITED: 'MESSAGE_EDITED',
      MESSAGE_DELETED: 'MESSAGE_DELETED',
      CHAT_CHANGED: 'CHAT_CHANGED'
    }
  })
};
