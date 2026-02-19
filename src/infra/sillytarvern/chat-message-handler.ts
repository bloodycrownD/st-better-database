import {type SqlExecutor, type Row} from '@/infra/sql';
import {ChatMessageManager} from '@/infra/sillytarvern/chat-message-manager.ts';

export class ChatMessageHandler {
    constructor(private readonly sqlExecutor: SqlExecutor) {
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
    }

    private onMessageEdited(messageId: number) {
        this.processMessage(messageId);
    }

    private onMessageDeleted() {
    }

    private onChatChanged() {
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

        const commitRows = this.sqlExecutor.dml2row(commitContent);
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

        ChatMessageManager.updateOrAppendRow(messageId, newRowContent);
    }
}
