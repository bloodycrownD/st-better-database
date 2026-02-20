import {ref} from 'vue';
import type {ColumnSchema} from '@/infra/sql';

export interface EditingColumn {
    fieldId: number;
    column: ColumnSchema;
}

export function useModals() {
    const showCreateTableModal = ref(false);
    const showEditTableNameModal = ref(false);
    const showEditTableCommentModal = ref(false);
    const showDropTableModal = ref(false);
    const showAddColumnModal = ref(false);
    const showEditColumnNameModal = ref(false);
    const showEditColumnCommentModal = ref(false);
    const showDropColumnModal = ref(false);
    const showDDLModal = ref(false);

    const editingColumn = ref<EditingColumn | null>(null);
    const exportedDDL = ref('');

    return {
        showCreateTableModal,
        showEditTableNameModal,
        showEditTableCommentModal,
        showDropTableModal,
        showAddColumnModal,
        showEditColumnNameModal,
        showEditColumnCommentModal,
        showDropColumnModal,
        showDDLModal,
        editingColumn,
        exportedDDL
    };
}
