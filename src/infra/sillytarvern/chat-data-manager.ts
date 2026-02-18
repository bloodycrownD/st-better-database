import {ChatMetaManager} from "@/infra/chat-meta-manager";
import {type Row, SqlType} from "@/infra/sql";
import {ChatMessageManager} from "@/infra/sillytarvern/chat-message-manager.ts";

export class ChatDataManager {
    static get executor() {

        const executor = ChatMetaManager.instance.tableTemplate.clone();

        const rows:Row[] = ChatMessageManager.getRows();
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

