import {type Row, type SqlExecutor} from "@/infra/sql";

export class ChatMessageUtil {
    private static readonly ROW_START_TAG = '<row>'
    private static readonly ROW_END_TAG = '</row>'
    private static readonly COMMIT_START_TAG = '<commit>'
    private static readonly COMMIT_END_TAG = '</commit>'
    private static readonly ROW_REGEX = new RegExp(`${ChatMessageUtil.ROW_START_TAG}(.*?)${ChatMessageUtil.ROW_END_TAG}`, 'gs')
    private static readonly COMMIT_REGEX = new RegExp(`${ChatMessageUtil.COMMIT_START_TAG}(.*?)${ChatMessageUtil.COMMIT_END_TAG}`, 'gs')

    static extractRow(messageText: string): Row[] {
        if (!messageText) return []

        const statements: Row[] = []
        ChatMessageUtil.ROW_REGEX.lastIndex = 0

        let match
        while ((match = ChatMessageUtil.ROW_REGEX.exec(messageText)) !== null) {
            const content = match[1]?.trim()
            if (content) {
                const parsed = JSON.parse(content) as Row[]
                statements.push(...parsed)
            }
        }

        return statements
    }

    static extractCommit(messageText: string): string[] {
        if (!messageText) return []

        const statements: string[] = []
        ChatMessageUtil.COMMIT_REGEX.lastIndex = 0

        let match
        while ((match = ChatMessageUtil.COMMIT_REGEX.exec(messageText)) !== null) {
            const content = match[1]?.trim()
            if (content) {
                const sqlList = content.split(';').filter(s => s.trim())
                statements.push(...sqlList)
            }
        }

        return statements
    }

    static commit2Row(messageText: string, executor: SqlExecutor): string {
        if (!messageText) return messageText
        if (messageText.includes(ChatMessageUtil.ROW_START_TAG)) return messageText

        const endPos = messageText.lastIndexOf(ChatMessageUtil.COMMIT_END_TAG)
        if (endPos === -1) return messageText

        const startPos = messageText.lastIndexOf(ChatMessageUtil.COMMIT_START_TAG, endPos)
        if (startPos === -1) return messageText

        const content = messageText.substring(startPos + ChatMessageUtil.COMMIT_START_TAG.length, endPos).trim()
        const result = messageText.substring(0, startPos) + messageText.substring(endPos + ChatMessageUtil.COMMIT_END_TAG.length)

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
        return `${result}${ChatMessageUtil.ROW_START_TAG}${rowTagContent}${ChatMessageUtil.ROW_END_TAG}`
    }
}
