import {ExtensionSettingManager} from '@/infra/sillytarvern/extension-setting-manager.ts';
import {ChatMetaManager} from '@/infra/sillytarvern/chat-meta-manager.ts';
import {ServiceBuilder} from '@/service/ServiceBuilder.ts';
import {ExportFormat} from "@/infra/sql";

export class Openapi {
    static init(): void {
        if (ExtensionSettingManager.instance.extensionSwitch){
            const context = SillyTavern.getContext();
            const {registerMacro, eventSource} = context;

            if (typeof window === 'undefined') {
                return;
            }

            window.getTemplateSqlExecutor = () => ExtensionSettingManager.instance.tableTemplate;
            window.getChatSqlExecutor = () => ChatMetaManager.instance.tableTemplate;

            eventSource.on('prompt_template_prepare', (env: any) => {
                env.getTemplateSqlExecutor = () => ExtensionSettingManager.instance.tableTemplate;
                env.getChatSqlExecutor = () => ChatMetaManager.instance.tableTemplate;
            });

            this.registerMacros(registerMacro);
        }
    }

    private static registerMacros(registerMacro: (name: string, handler: () => unknown) => void): void {
        const chatTableManagementService = ServiceBuilder.chatTableManagementService;

        registerMacro('GET_ALL_TABLE_NAMES', () => {
            return chatTableManagementService.getTables().map(table => table.tableName);
        });

        registerMacro('GET_ALL_TABLE_SCHEMAS', () => ChatMetaManager.instance.tableTemplate.export(ExportFormat.DDL));

        registerMacro('GET_ALL_TABLE_DATA', () => ChatMetaManager.instance.tableTemplate.export(ExportFormat.MARKDOWN));
    }
}
