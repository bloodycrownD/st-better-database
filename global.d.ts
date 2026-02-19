export {};

declare global {
    interface ExtensionSettings {
        [key: string]: unknown;
    }

    interface ChatMessage {
        id: number;
        name: string;
        role: string;
        mes: string;
        date: number;
    }

    interface EventTypes {
        MESSAGE_RECEIVED: string;
        MESSAGE_EDITED: string;
        MESSAGE_DELETED: string;
        CHAT_CHANGED: string;
    }

    const SillyTavern: {
        getContext: () => {
            extensionSettings: Record<string, ExtensionSettings>;
            saveSettingsDebounced: () => void;
            chat: ChatMessage[];
            saveChat: () => void;
            chatMetadata: Record<string, any>;
            saveMetadata: () => void;
            eventSource: {
                on: (event: string, handler: (...args: any[]) => void) => void;
            };
            event_types: EventTypes;
        };
    };
    const $:any;
}
