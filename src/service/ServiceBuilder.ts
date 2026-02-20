import {ChatDataManagementService} from "@/service/impl/chat/chat-data-management-service.ts";
import {ChatTableManagementService} from "@/service/impl/chat/chat-table-management-service.ts";
import {TemplateTableManagementService} from "@/service/impl/template/template-table-management-service.ts";
import {SystemDataManagementService} from "@/service/impl/system/system-data-management-service.ts";
import {SystemTableManagementService} from "@/service/impl/system/system-table-management-service.ts";
import {SystemSqlExecutorService} from "@/service/impl/system/system-sql-executor-service.ts";
import {SystemDatabaseSyncService} from "@/service/impl/system/system-database-sync-service.ts";
import type {DataManagementService} from "@/service/interfaces/data-management-service.ts";
import type {TableManagementService} from "@/service/interfaces/table-management-service.ts";
import {ChatSqlExecutorService} from "@/service/impl/chat/chat-sql-executor-service.ts";
import {TemplateSqlExecutorService} from "@/service/impl/template/template-sql-executor-service.ts";
import type {SqlExecutorService} from "@/service/interfaces/sql-executor-service.ts";
import {ChatDatabaseSyncService} from "@/service/impl/chat/chat-database-sync-service.ts";
import type {DatabaseSyncService} from "@/service/interfaces/database-sync-service.ts";

export class ServiceBuilder {
    private static readonly _chatDataManagementService: DataManagementService = new ChatDataManagementService();
    private static readonly _chatTableManagementService: TableManagementService = new ChatTableManagementService();
    private static readonly _chatSqlExecutorService: SqlExecutorService = new ChatSqlExecutorService();
    private static readonly _templateSqlExecutorService: SqlExecutorService = new TemplateSqlExecutorService();
    private static readonly _templateTableManagementService: TableManagementService = new TemplateTableManagementService();
    private static readonly _chatDatabaseSyncService: DatabaseSyncService = new ChatDatabaseSyncService();
    private static readonly _systemDataManagementService: DataManagementService = new SystemDataManagementService();
    private static readonly _systemTableManagementService: TableManagementService = new SystemTableManagementService();
    private static readonly _systemSqlExecutorService: SqlExecutorService = new SystemSqlExecutorService();
    private static readonly _systemDatabaseSyncService: DatabaseSyncService = new SystemDatabaseSyncService();

    static get chatDataManagementService(): DataManagementService {
        return ServiceBuilder._chatDataManagementService;
    }

    static get chatTableManagementService(): TableManagementService {
        return ServiceBuilder._chatTableManagementService;
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

    static get chatDatabaseSyncService(): DatabaseSyncService {
        return ServiceBuilder._chatDatabaseSyncService;
    }

    static get systemDataManagementService(): DataManagementService {
        return ServiceBuilder._systemDataManagementService;
    }

    static get systemTableManagementService(): TableManagementService {
        return ServiceBuilder._systemTableManagementService;
    }

    static get systemSqlExecutorService(): SqlExecutorService {
        return ServiceBuilder._systemSqlExecutorService;
    }

    static get systemDatabaseSyncService(): DatabaseSyncService {
        return ServiceBuilder._systemDatabaseSyncService;
    }
}
