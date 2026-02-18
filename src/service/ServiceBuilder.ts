import {ChatDataManagementService} from "@/service/impl/chat-data-management-service.ts";
import {ChatTableManagementService} from "@/service/impl/chat-table-management-service.ts";
import {TemplateTableManagementService} from "@/service/impl/template-table-management-service.ts";
import type {DataManagementService} from "@/service/interfaces/data-management-service.ts";
import type {TableManagementService} from "@/service/interfaces/table-management-service.ts";
import {ChatSqlExecutorService} from "@/service/impl/chat-sql-executor-service.ts";
import {TemplateSqlExecutorService} from "@/service/impl/template-sql-executor-service.ts";
import type {SqlExecutorService} from "@/service/interfaces/sql-executor-service.ts";

export class ServiceBuilder {
    private static readonly _chatDataManagementService: DataManagementService = new ChatDataManagementService();
    private static readonly _tableManagementService: TableManagementService = new ChatTableManagementService();
    private static readonly _chatSqlExecutorService: SqlExecutorService = new ChatSqlExecutorService();
    private static readonly _templateSqlExecutorService: SqlExecutorService = new TemplateSqlExecutorService();
    private static readonly _templateTableManagementService: TableManagementService = new TemplateTableManagementService();

    static get chatDataManagementService(): DataManagementService {
        return ServiceBuilder._chatDataManagementService;
    }

    static get tableManagementService(): TableManagementService {
        return ServiceBuilder._tableManagementService;
    }

    static get chatSqlExecutorService(): SqlExecutorService {
        return ServiceBuilder._chatSqlExecutorService;
    }

    static get templateSqlExecutorService(): SqlExecutorService {
        return ServiceBuilder._templateSqlExecutorService;
    }

    static get templateTableManagementService(): TableManagementService {
        return ServiceBuilder._templateTableManagementService;
    }
}
