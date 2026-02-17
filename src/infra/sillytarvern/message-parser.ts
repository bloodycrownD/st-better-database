import {type Row, SimpleSqlExecutor} from "@/infra/sql";

export class MessageParser {
    static rowRegex = /<row>(.*?)<\/row>/gs
    static commitRegex = /<commit>(.*?)<\/commit>/gs

    static extractRowFromMessage(messageText: string): Row[] {
        if (!messageText) return []

        const statements: Row[] = []
        let match

        MessageParser.rowRegex.lastIndex = 0

        while ((match = MessageParser.rowRegex.exec(messageText)) !== null) {
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
        let match

        MessageParser.commitRegex.lastIndex = 0

        while ((match = MessageParser.commitRegex.exec(messageText)) !== null) {
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
            console.log('[MessageParser] 已存在row标签，跳过解析')
            return messageText
        }

        const endTag = '</commit>'
        const startTag = '<commit>'
        const endPos = messageText.lastIndexOf(endTag)

        if (endPos === -1) {
            console.log('[MessageParser] 未找到</commit>标签，直接返回原消息')
            return messageText
        }

        const startPos = messageText.lastIndexOf(startTag, endPos)

        if (startPos === -1) {
            console.log('[MessageParser] 未找到<commit>标签，直接返回原消息')
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

            const existingRows = MessageParser.extractRowFromMessage(result)

            if (existingRows.length > 0) {
                const mergedRows = [...existingRows, ...allRows]
                result = result.replace(
                    /(<row>.*)(<\/row>)/s,
                    `$1${JSON.stringify(mergedRows)}$2`
                )
            } else {
                result += `<row>${rowTagContent}</row>`
            }
        }

        return result
    }
}
