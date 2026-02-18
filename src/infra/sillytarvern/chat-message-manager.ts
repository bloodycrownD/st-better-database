import {type Row} from "@/infra/sql";

export class ChatMessageManager {
    private static readonly ROW_START_TAG = '<row>'
    private static readonly ROW_END_TAG = '</row>'
    private static readonly COMMIT_START_TAG = '<commit>'
    private static readonly COMMIT_END_TAG = '</commit>'
    private static readonly ROW_REGEX = new RegExp(`${ChatMessageManager.ROW_START_TAG}(.*?)${ChatMessageManager.ROW_END_TAG}`, 'gs')
    private static readonly context = SillyTavern.getContext()

    static getRows(): Row[] {
        const chat = this.context.chat || []
        const rows: Row[] = [];
        for (const message of chat) {
            if (message.mes) {
                ChatMessageManager.ROW_REGEX.lastIndex = 0
                let match
                while ((match = ChatMessageManager.ROW_REGEX.exec(message.mes)) !== null) {
                    const content = match[1]?.trim()
                    if (content) {
                        const parsed = JSON.parse(content) as Row[]
                        rows.push(...parsed)
                    }
                }
            }
        }
        return rows
    }

    static processMessage(index: number, startTag: string, endTag: string, processer: (content: string) => string) {
        const chat = this.context.chat || []
        const messageText = chat[index]?.mes;
        if (!messageText) return;
        if (messageText.includes(startTag)) return;

        const endPos = messageText.lastIndexOf(endTag)
        if (endPos === -1) return;

        const startPos = messageText.lastIndexOf(startTag, endPos)
        if (startPos === -1) return;

        const content = messageText.substring(startPos + startTag.length, endPos).trim()
        const result = messageText.substring(0, startPos) + messageText.substring(endPos + endTag.length)

        const processed = processer(content);
        chat[index].mes = result + processed;
        this.context.saveChat();
    }

    static processCommit(index: number, processer: (content: string) => string): void {
        return ChatMessageManager.processMessage(index, ChatMessageManager.COMMIT_START_TAG, ChatMessageManager.COMMIT_END_TAG, processer)
    }

    static processRows(index: number, processer: (content: string) => string): void {
        return ChatMessageManager.processMessage(index, ChatMessageManager.ROW_START_TAG, ChatMessageManager.ROW_END_TAG, processer)
    }
    static processLastRows(processer: (content: string) => string){
        if (this.context.chat?.length == 0){
            this.context.chat.push({
                id: 0,
                name: '',
                role: 'assistant',
                mes: '',
                date: Date.now(),
            })
        }
        this.processRows(this.context.chat.length - 1, processer)
    }
}
