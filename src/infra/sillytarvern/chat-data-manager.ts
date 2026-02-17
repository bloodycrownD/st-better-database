import {ChatMetaManager} from "@/infra/chat-meta-manager";
import {type Row, SqlType} from "@/infra/sql";
import {MessageParser} from "@/infra/sillytarvern/message-parser.ts";

export class ChatDataManager {
    get storage() {
        const chat = SillyTavern.getContext().chat || []

        const executor = ChatMetaManager.instance.tableTemplate.clone();

        const rows:Row[] = [];
        for (const message of chat) {
            if (message.mes) {
                rows.push(...MessageParser.extractRowFromMessage(message.mes))
            }
        }

        if (rows.length > 0) {
            try {
                const dml = executor.row2dml(rows)
                executor.execute(dml, [SqlType.DML])
            } catch (error) {
                console.error('[ChatDataManager] Failed to execute row statement:', error)
            }
        }

        return executor
    }
}

