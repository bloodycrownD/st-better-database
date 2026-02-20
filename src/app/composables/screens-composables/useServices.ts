import {computed} from 'vue';
import {ServiceBuilder} from '@/service/ServiceBuilder.ts';

export function useChatServices() {
    const dataManagementService = computed(() => ServiceBuilder.chatDataManagementService);
    const tableManagementService = computed(() => ServiceBuilder.chatTableManagementService);
    const sqlExecutorService = computed(() => ServiceBuilder.chatSqlExecutorService);
    const databaseSyncService = computed(() => ServiceBuilder.chatDatabaseSyncService);

    return {
        dataManagementService,
        tableManagementService,
        sqlExecutorService,
        databaseSyncService
    };
}

export function useTemplateServices() {
    const tableManagementService = computed(() => ServiceBuilder.templateTableManagementService);
    const sqlExecutorService = computed(() => ServiceBuilder.templateSqlExecutorService);

    return {
        tableManagementService,
        sqlExecutorService
    };
}

export function useSystemServices() {
    const dataManagementService = computed(() => ServiceBuilder.systemDataManagementService);
    const tableManagementService = computed(() => ServiceBuilder.systemTableManagementService);
    const sqlExecutorService = computed(() => ServiceBuilder.systemSqlExecutorService);
    const databaseSyncService = computed(() => ServiceBuilder.systemDatabaseSyncService);

    return {
        dataManagementService,
        tableManagementService,
        sqlExecutorService,
        databaseSyncService
    };
}
