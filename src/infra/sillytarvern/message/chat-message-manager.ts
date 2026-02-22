export class ChatMessageManager {
    private static readonly COMMITTED_START_TAG = '<committed>'
    private static readonly COMMITTED_END_TAG = '</committed>'
    private static readonly COMMIT_START_TAG = '<commit>'
    private static readonly COMMIT_END_TAG = '</commit>'

    static getCommitted(): string {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const committedList: string[] = [];
        for (const message of chat) {
            if (message.mes) {
                const content = this.extractTagContent(message.mes, ChatMessageManager.COMMITTED_START_TAG, ChatMessageManager.COMMITTED_END_TAG);
                if (content) {
                    committedList.push(content);
                }
            }
        }
        return committedList.join(';\n');
    }

    static processMessage(index: number, startTag: string, endTag: string, processer: (content: string | null) => string) {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const message = chat[index];

        if (!message) {
            return;
        }

        const messageText = message.mes || '';

        const content = this.extractTagContent(messageText, startTag, endTag);
        const processed = processer(content);

        if (content === null) {
            message.mes = messageText + processed;
        } else {
            const endPos = messageText.lastIndexOf(endTag);
            const startPos = messageText.lastIndexOf(startTag, endPos);
            const beforeTag = messageText.substring(0, startPos);
            const afterTag = messageText.substring(endPos + endTag.length);
            message.mes = beforeTag + processed + afterTag;
        }
        context?.saveChat();
    }

    static processCommit(index: number, processer: (content: string | null) => string): void {
        return ChatMessageManager.processMessage(index, ChatMessageManager.COMMIT_START_TAG, ChatMessageManager.COMMIT_END_TAG, processer)
    }

    static processCommitted(index: number, processer: (content: string | null) => string): void {
        return ChatMessageManager.processMessage(index, ChatMessageManager.COMMITTED_START_TAG, ChatMessageManager.COMMITTED_END_TAG, processer)
    }

    static processLastCommitted(processer: (content: string | null) => string) {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        if (chat.length == 0) {
            context?.chat.push({
                id: 0,
                name: '',
                role: 'assistant',
                mes: '',
                date: Date.now(),
            })
        }
        this.processCommitted(context?.chat.length - 1, processer)
    }

    static extractCommit(message: string): string | null {
        return this.extractTagContent(message, ChatMessageManager.COMMIT_START_TAG, ChatMessageManager.COMMIT_END_TAG);
    }

    static extractCommitted(message: string): string | null {
        return this.extractTagContent(message, ChatMessageManager.COMMITTED_START_TAG, ChatMessageManager.COMMITTED_END_TAG);
    }

    static replaceCommitWithCommitted(messageId: number, newCommittedContent: string): void {
        const context = SillyTavern.getContext();
        const chat = context?.chat || [];
        const message = chat[messageId];

        if (!message) {
            return;
        }

        let text = message.mes || '';

        const commitEndPos = text.lastIndexOf(ChatMessageManager.COMMIT_END_TAG);
        if (commitEndPos !== -1) {
            const commitStartPos = text.lastIndexOf(ChatMessageManager.COMMIT_START_TAG, commitEndPos);
            if (commitStartPos !== -1) {
                const beforeCommit = text.substring(0, commitStartPos);
                const afterCommit = text.substring(commitEndPos + ChatMessageManager.COMMIT_END_TAG.length);
                const hasBeforeSpace = /\s$/.test(beforeCommit);
                const hasAfterSpace = /^\s/.test(afterCommit);
                if (hasBeforeSpace && hasAfterSpace) {
                    text = beforeCommit.replace(/\s$/, '') + afterCommit;
                } else {
                    text = beforeCommit + afterCommit;
                }
            }
        }

        const committedEndPos = text.lastIndexOf(ChatMessageManager.COMMITTED_END_TAG);
        if (committedEndPos !== -1) {
            const committedStartPos = text.lastIndexOf(ChatMessageManager.COMMITTED_START_TAG, committedEndPos);
            if (committedStartPos !== -1) {
                const beforeCommitted = text.substring(0, committedStartPos);
                const afterCommitted = text.substring(committedEndPos + ChatMessageManager.COMMITTED_END_TAG.length);
                text = beforeCommitted + ChatMessageManager.COMMITTED_START_TAG + newCommittedContent + ChatMessageManager.COMMITTED_END_TAG + afterCommitted;
            }
        } else {
            text = text + ChatMessageManager.COMMITTED_START_TAG + newCommittedContent + ChatMessageManager.COMMITTED_END_TAG;
        }

        message.mes = text;
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
