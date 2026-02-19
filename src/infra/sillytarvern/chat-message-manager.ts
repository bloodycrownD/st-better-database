import {type Row} from "@/infra/sql";

export class ChatMessageManager {
    private static readonly ROW_START_TAG = '<row>'
    private static readonly ROW_END_TAG = '</row>'
    private static readonly COMMIT_START_TAG = '<commit>'
    private static readonly COMMIT_END_TAG = '</commit>'

    static getRows(): Row[] {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const rows: Row[] = [];
        for (const message of chat) {
            if (message.mes) {
                const content = this.extractTagContent(message.mes, ChatMessageManager.ROW_START_TAG, ChatMessageManager.ROW_END_TAG);
                if (content) {
                    try {
                        const parsed = JSON.parse(content) as Row[];
                        rows.push(...parsed);
                    } catch (e) {
                    }
                }
            }
        }
        return rows
    }

    static processMessage(index: number, startTag: string, endTag: string, processer: (content: string | null) => string) {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const messageText = chat[index]?.mes;

        const content = this.extractTagContent(messageText || '', startTag, endTag);
        const processed = processer(content);

        if (content === null) {
            chat[index].mes = processed;
        } else {
            const endPos = messageText!.lastIndexOf(endTag);
            const startPos = messageText!.lastIndexOf(startTag, endPos);
            const beforeTag = messageText!.substring(0, startPos);
            const afterTag = messageText!.substring(endPos + endTag.length);
            chat[index].mes = beforeTag + processed + afterTag;
        }
        context?.saveChat();
    }

    static processCommit(index: number, processer: (content: string | null) => string): void {
        return ChatMessageManager.processMessage(index, ChatMessageManager.COMMIT_START_TAG, ChatMessageManager.COMMIT_END_TAG, processer)
    }

    static processRows(index: number, processer: (content: string | null) => string): void {
        return ChatMessageManager.processMessage(index, ChatMessageManager.ROW_START_TAG, ChatMessageManager.ROW_END_TAG, processer)
    }

    static processLastRows(processer: (content: string | null) => string){
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        if (chat.length == 0){
            context?.chat.push({
                id: 0,
                name: '',
                role: 'assistant',
                mes: '',
                date: Date.now(),
            })
        }
        this.processRows(context?.chat.length - 1, processer)
    }

    static extractCommit(message: string): string | null {
        return this.extractTagContent(message, ChatMessageManager.COMMIT_START_TAG, ChatMessageManager.COMMIT_END_TAG);
    }

    static extractRow(message: string): string | null {
        return this.extractTagContent(message, ChatMessageManager.ROW_START_TAG, ChatMessageManager.ROW_END_TAG);
    }

    static updateOrAppendRow(messageId: number, newRowContent: string): void {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const message = chat[messageId];

        if (!message || !message.mes) {
            return;
        }

        const messageText = message.mes;
        let result: string;

        const rowEndPos = messageText.lastIndexOf(ChatMessageManager.ROW_END_TAG);
        if (rowEndPos !== -1) {
            const rowStartPos = messageText.lastIndexOf(ChatMessageManager.ROW_START_TAG, rowEndPos);
            if (rowStartPos !== -1) {
                const beforeRow = messageText.substring(0, rowStartPos);
                const afterRow = messageText.substring(rowEndPos + ChatMessageManager.ROW_END_TAG.length);
                result = beforeRow + ChatMessageManager.ROW_START_TAG + newRowContent + ChatMessageManager.ROW_END_TAG + afterRow;
            } else {
                result = messageText;
            }
        } else {
            const commitEndPos = messageText.lastIndexOf(ChatMessageManager.COMMIT_END_TAG);
            if (commitEndPos !== -1) {
                result = messageText.substring(0, commitEndPos + ChatMessageManager.COMMIT_END_TAG.length) + ChatMessageManager.ROW_START_TAG + newRowContent + ChatMessageManager.ROW_END_TAG;
            } else {
                result = ChatMessageManager.ROW_START_TAG + newRowContent + ChatMessageManager.ROW_END_TAG;
            }
        }

        chat[messageId].mes = result;
        context?.saveChat();
    }

    private static extractTagContent(message: string, startTag: string, endTag: string): string | null {
        const endPos = message.lastIndexOf(endTag);
        if (endPos === -1) return null;

        const startPos = message.lastIndexOf(startTag, endPos);
        if (startPos === -1) return null;

        return message.substring(startPos + startTag.length, endPos).trim() || null;
    }
}
