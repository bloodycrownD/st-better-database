import {type Row, SimpleSqlExecutor} from "@/infra/sql";

export class MessageParser {
    static extractRowFromMessage(messageText: string): Row[] {
        if (!messageText) return []

        const statements: Row[] = []
        const rowRegex = /<row>(.*?)<\/row>/gs

        let match
        while ((match = rowRegex.exec(messageText)) !== null) {
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
        const commitRegex = /<commit>(.*?)<\/commit>/gs

        let match
        while ((match = commitRegex.exec(messageText)) !== null) {
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

        if (messageText.includes('<row>')) {
            return messageText
        }

        const endTag = '</commit>'
        const startTag = '<commit>'
        const endPos = messageText.lastIndexOf(endTag)

        if (endPos === -1) {
            return messageText
        }

        const startPos = messageText.lastIndexOf(startTag, endPos)

        if (startPos === -1) {
            return messageText
        }

        const content = messageText.substring(startPos + startTag.length, endPos).trim()
        let result = messageText.substring(0, startPos) + messageText.substring(endPos + endTag.length)

        const allRows: Row[] = []
        const commitStatements = content.split(';').filter(s => s.trim())

        for (const sql of commitStatements) {
            try {
                const rows = executor.dml2row(sql)
                if (rows && rows.length > 0) {
                    allRows.push(...rows)
                }
            } catch (error) {
                console.error('[MessageParser] dml2row error:', error, 'for SQL:', sql)
            }
        }

        if (allRows.length > 0) {
            const rowTagContent = JSON.stringify(allRows)
            result += `<row>${rowTagContent}</row>`
        }

        return result
    }
}
