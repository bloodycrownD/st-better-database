import {type Row, SimpleSqlExecutor} from "@/infra/sql";

export class ChatMessageParser {
    private static readonly ROW_START_TAG = '<row>'
    private static readonly ROW_END_TAG = '</row>'
    private static readonly COMMIT_START_TAG = '<commit>'
    private static readonly COMMIT_END_TAG = '</commit>'
    private static readonly ROW_REGEX = new RegExp(`${ChatMessageParser.ROW_START_TAG}(.*?)${ChatMessageParser.ROW_END_TAG}`, 'gs')
    private static readonly COMMIT_REGEX = new RegExp(`${ChatMessageParser.COMMIT_START_TAG}(.*?)${ChatMessageParser.COMMIT_END_TAG}`, 'gs')

    static extractRowFromMessage(messageText: string): Row[] {
        if (!messageText) return []

        const statements: Row[] = []
        ChatMessageParser.ROW_REGEX.lastIndex = 0

        let match
        while ((match = ChatMessageParser.ROW_REGEX.exec(messageText)) !== null) {
            const content = match[1]?.trim()
            if (content) {
                const parsed = JSON.parse(content) as Row[]
                statements.push(...parsed)
            }
        }

        return statements
    }

    static extractCommitFromMessage(messageText: string): string[] {
        if (!messageText) return []

        const statements: string[] = []
        ChatMessageParser.COMMIT_REGEX.lastIndex = 0

        let match
        while ((match = ChatMessageParser.COMMIT_REGEX.exec(messageText)) !== null) {
            const content = match[1]?.trim()
            if (content) {
                const sqlList = content.split(';').filter(s => s.trim())
                statements.push(...sqlList)
            }
        }

        return statements
    }

    static processCommitToRow(messageText: string, executor: SimpleSqlExecutor): string {
        if (!messageText) return messageText
        if (messageText.includes(ChatMessageParser.ROW_START_TAG)) return messageText

        const endPos = messageText.lastIndexOf(ChatMessageParser.COMMIT_END_TAG)
        if (endPos === -1) return messageText

        const startPos = messageText.lastIndexOf(ChatMessageParser.COMMIT_START_TAG, endPos)
        if (startPos === -1) return messageText

        const content = messageText.substring(startPos + ChatMessageParser.COMMIT_START_TAG.length, endPos).trim()
        const result = messageText.substring(0, startPos) + messageText.substring(endPos + ChatMessageParser.COMMIT_END_TAG.length)

        const allRows: Row[] = []
        const commitStatements = content.split(';').filter(s => s.trim())

        for (const sql of commitStatements) {
            try {
                const rows = executor.dml2row(sql)
                if (rows?.length) {
                    allRows.push(...rows)
                }
            } catch (error) {
                console.error('[MessageParser] dml2row error:', error, 'for SQL:', sql)
            }
        }

        if (!allRows.length) return result

        const rowTagContent = JSON.stringify(allRows)
        return `${result}${ChatMessageParser.ROW_START_TAG}${rowTagContent}${ChatMessageParser.ROW_END_TAG}`
    }
}
