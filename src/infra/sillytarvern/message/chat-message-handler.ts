import {ChatSqlExecutor} from '@/infra/sql';
import {ChatMessageManager} from '@/infra/sillytarvern/message/chat-message-manager.ts';
import {ChatMetaManager} from "@/infra/sillytarvern/persistent/chat-meta-manager.ts";
import {ExtensionSettingManager} from "@/infra/sillytarvern/persistent/extension-setting-manager.ts";
import {TemplateRenderer} from '@/infra/sillytarvern/template-render';

export class ChatMessageHandler {
    private static instance: ChatMessageHandler;

    constructor() {
    }

    static init() {
        if (ExtensionSettingManager.instance.extensionSwitch) {
            if (!ChatMessageHandler.instance) {
                const handler = new ChatMessageHandler();
                handler.registerEventListeners();
                ChatMessageHandler.instance = handler;
            }
        }
    }

    registerEventListeners() {
        const context = SillyTavern.getContext() as any;
        const {eventSource, event_types} = context;

        eventSource.on(event_types.MESSAGE_RECEIVED, (messageId: number) => this.onMessageReceived(messageId));
        eventSource.on(event_types.MESSAGE_EDITED, (messageId: number) => this.onMessageEdited(messageId));
        eventSource.on(event_types.MESSAGE_DELETED, (_messageId: number) => this.onMessageDeleted());
        eventSource.on(event_types.CHAT_CHANGED, () => this.onChatChanged());
    }

    private onMessageReceived(messageId: number) {
        this.processMessage(messageId);
        TemplateRenderer.getInstance().updateChatTemplateDisplay();
    }

    private onMessageEdited(messageId: number) {
        this.processMessage(messageId);
        TemplateRenderer.getInstance().updateChatTemplateDisplay();
    }

    private onMessageDeleted() {
        TemplateRenderer.getInstance().updateChatTemplateDisplay();
    }

    private onChatChanged() {
        ChatMetaManager.instance.reload();
        TemplateRenderer.getInstance().updateChatTemplateDisplay();
    }

    private processMessage(messageId: number) {
        const context = SillyTavern.getContext() as any;
        const chat = context.chat || [];
        const message = chat[messageId];

        if (!message || !message.mes) {
            return;
        }

        const commitContent = ChatMessageManager.extractCommit(message.mes);
        if (!commitContent) {
            return;
        }

        try {
            const tableTemplate = ChatMetaManager.instance.tableTemplate as ChatSqlExecutor;
            const compressedDml = tableTemplate.compressDml(commitContent);

            const committedContent = ChatMessageManager.extractCommitted(message.mes);
            let existingCommitted = '';

            if (committedContent) {
                existingCommitted = committedContent;
            }

            const newCommitted = existingCommitted ? `${existingCommitted};\n${compressedDml}` : compressedDml;

            ChatMessageManager.replaceCommitWithCommitted(messageId, newCommitted);
        } catch (error) {
            console.error('[ChatMessageHandler] Failed to compress commit:', error);
            return;
        }
    }
}
