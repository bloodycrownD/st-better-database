import type {SqlExecutor} from '@/infra/sql';

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

    interface ChatMetadata {
        tableTemplate?: unknown;
        [key: string]: unknown;
    }

    const SillyTavern: {
        getContext: () => {
            extensionSettings: Record<string, ExtensionSettings>;
            saveSettingsDebounced: () => void;
            chat: ChatMessage[];
            saveChat: () => void;
            chatMetadata: Record<string, ChatMetadata>;
            saveMetadata: () => void;
            eventSource: {
                on: (event: string, handler: (...args: unknown[]) => void) => void;
            };
            event_types: EventTypes;
            registerMacro: (name: string, handler: () => unknown) => void;
        };
    };

    interface Window {
        getTemplateSqlExecutor: () => SqlExecutor;
        getChatSqlExecutor: () => SqlExecutor;
        chatDatabaseData: () => any;
    }

    const $: any;
}
