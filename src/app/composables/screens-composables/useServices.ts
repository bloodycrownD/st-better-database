import {computed} from 'vue';
import {ServiceBuilder} from '@/service/ServiceBuilder.ts';

export function useChatServices() {
    const dataManagementService = computed(() => ServiceBuilder.chatDataManagementService);
    const tableManagementService = computed(() => ServiceBuilder.chatTableManagementService);
    const sqlExecutorService = computed(() => ServiceBuilder.chatSqlExecutorService);

    return {
        dataManagementService,
        tableManagementService,
        sqlExecutorService
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
