import {type Row} from '@/infra/sql';
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
            const commitRows = ChatMetaManager.instance.tableTemplate.dml2row(commitContent);

            const rowContent = ChatMessageManager.extractRow(message.mes);
            let existingRows: Row[] = [];

            if (rowContent) {
                try {
                    existingRows = JSON.parse(rowContent) as Row[];
                } catch (e) {
                    existingRows = [];
                }
            }

            const mergedRows = [...existingRows, ...commitRows];
            const newRowContent = JSON.stringify(mergedRows);

            ChatMessageManager.replaceCommitWithRow(messageId, newRowContent);
        } catch (error) {
            console.error('[ChatMessageHandler] Failed to convert commit to row:', error);
            return;
        }
    }
}
