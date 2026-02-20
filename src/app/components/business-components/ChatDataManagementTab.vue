<template>
  <div class="chat-data-management-tab">
    <EmptyState v-if="!selectedTable" icon="fa-solid fa-table" text="请选择一个表格进行管理"/>

    <div v-else class="data-detail">
      <div class="data-toolbar">
        <div class="data-title">
          <span class="table-name">{{ currentTable.tableName }}</span>
          <span v-if="currentTable.comment" class="table-comment">{{ currentTable.comment }}</span>
        </div>
        <div class="data-actions">
          <Button @click="showAddDataModal = true">
            <i class="fa-solid fa-plus" style="margin-right: 6px;"></i>
            添加数据
          </Button>
          <Button type="danger" @click="handleBatchDelete">
            <i class="fa-solid fa-trash" style="margin-right: 6px;"></i>
            {{ batchDeleteButtonText }}
          </Button>
          <Button @click="handleExport">
            <i class="fa-solid fa-download" style="margin-right: 6px;"></i>
            导出
          </Button>
        </div>
      </div>

      <div class="data-list">
        <EmptyState v-if="dataList.length === 0" icon="fa-solid fa-database" text="暂无数据"/>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
            <tr>
              <th v-if="showCheckboxColumn" class="checkbox-header sticky-col" style="left: 0">
                <label class="checkbox-wrapper">
                  <input type="checkbox"
                         :checked="selectedRows.size === dataList.length && dataList.length > 0"
                         @change="handleSelectAll"/>
                </label>
              </th>
              <th class="actions-header sticky-col" :style="{ left: showCheckboxColumn ? '50px' : '0' }">
                操作
              </th>
              <th v-for="column in columnList" :key="column.name"
                  :class="['column-header', column.primitiveKey ? 'primary-key' : '']">
                {{ column.name }}
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(row, rowIndex) in dataList" :key="rowIndex" class="table-row">
              <td v-if="showCheckboxColumn" class="checkbox-cell sticky-col" style="left: 0">
                <label class="checkbox-wrapper">
                  <input type="checkbox" :checked="selectedRows.has(rowIndex)" @change="handleRowSelect(rowIndex)"/>
                </label>
              </td>
              <td class="actions-cell sticky-col" :style="{ left: showCheckboxColumn ? '50px' : '0' }">
                <div class="row-actions">
                  <Button size="small" @click="openEditDataModal(rowIndex, row)">
                    <i class="fa-solid fa-pen"></i>
                  </Button>
                  <Button type="danger" size="small" @click="openDeleteDataModal(rowIndex)">
                    <i class="fa-solid fa-trash"></i>
                  </Button>
                </div>
              </td>
              <td v-for="column in columnList" :key="column.name"
                  :class="['table-cell', column.primitiveKey ? 'primary-key' : '']">
                <span class="cell-value">{{ formatValue(row[column.name]) }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ToastNotification
        :visible="toast.visible"
        :message="toast.message"
        :type="toast.type"
        :icon="toast.icon"
    />

    <DataForm
        v-if="showAddDataModal"
        title="添加数据"
        :columns="columnList"
        modal-width="50vw"
        @submit="handleAddData"
        @cancel="showAddDataModal = false"
    />

    <DataForm
        v-if="showEditDataModal && editingData"
        title="编辑数据"
        :columns="columnList"
        :initial-data="editingData.row"
        modal-width="50vw"
        @submit="handleEditData"
        @cancel="showEditDataModal = false"
    />

    <DeleteDataConfirm v-if="showDeleteDataModal" modal-width="500px" modal-height="auto"
                       @confirm="handleDeleteData" @cancel="showDeleteDataModal = false"/>

    <PopupModal v-if="showExportModal" visible title="导出数据" @close="showExportModal = false">
      <ExportDisplay :sql="exportedSql" @close="showExportModal = false"/>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
import ToastNotification from '@/app/components/pure-components/ToastNotification.vue';
import EmptyState from '@/app/components/pure-components/EmptyState.vue';
import type {ColumnSchema, SqlValue, TableSchema} from '@/infra/sql';
import {Where} from '@/infra/sql';
import type {DataManagementService} from '@/service/interfaces/data-management-service.ts';
import {useToast} from '@/app/composables/components-composables/useToast.ts';
import DataForm from '@/app/components/business-components/DataForm.vue';
import DeleteDataConfirm from '@/app/components/business-components/DeleteDataConfirm.vue';
import ExportDisplay from '@/app/components/business-components/ExportDisplay.vue';

interface Props {
  dataService: DataManagementService;
  tables: TableSchema[];
  selectedTable?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const currentTable = computed<TableSchema>(() => {
  return props.tables.find(t => t.tableName === props.selectedTable) || {} as TableSchema;
});

const columnList = computed<ColumnSchema[]>(() => {
  if (!currentTable.value.columnSchemas) return [];
  return Object.values(currentTable.value.columnSchemas);
});

const batchDeleteButtonText = computed(() => {
  if (batchDeleteMode.value === 'none') return '批量删除';
  if (batchDeleteMode.value === 'selecting') return '取消删除';
  if (batchDeleteMode.value === 'confirming') return '确认删除';
  return '批量删除';
});

const dataList = ref<any[]>([]);
const selectedRows = ref<Set<number>>(new Set());
const showCheckboxColumn = ref(false);
const batchDeleteMode = ref<'none' | 'selecting' | 'confirming'>('none');
const {toast, showToast} = useToast();

const showAddDataModal = ref(false);
const showEditDataModal = ref(false);
const showDeleteDataModal = ref(false);
const showExportModal = ref(false);
const editingData = ref<{ index: number, row: any } | null>(null);
const exportedSql = ref('');

const formatValue = (value: any): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';

  const str = String(value);
  return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '\\n')
      .replace(/<br>/gi, '&lt;br&gt;');
};

const loadTableData = () => {
  if (currentTable.value.tableName) {
    const result = props.dataService.queryData(currentTable.value.tableName);
    if (result.success && Array.isArray(result.data)) {
      dataList.value = result.data;
    } else {
      dataList.value = [];
    }
  }
};

const handleAddData = (data: Map<string, SqlValue>) => {
  if (currentTable.value.tableName) {
    const result = props.dataService.insertData(currentTable.value.tableName, data);
    if (result.success) {
      showAddDataModal.value = false;
      loadTableData();
      showToast('数据添加成功');
    } else {
      showToast(result.message || '添加失败', 'error');
    }
  }
};

const openEditDataModal = (rowIndex: number, row: any) => {
  editingData.value = {index: rowIndex, row};
  showEditDataModal.value = true;
};

const handleEditData = (data: Map<string, SqlValue>) => {
  if (currentTable.value.tableName && editingData.value) {
    const primaryKeyColumn = columnList.value.find(col => col.primitiveKey);
    const row = dataList.value[editingData.value.index];

    let where = Where.of();
    if (primaryKeyColumn) {
      const pkValue = row[primaryKeyColumn.name];
      where = where.eq(primaryKeyColumn.name, pkValue);
    }

    const result = props.dataService.updateData(currentTable.value.tableName, data, where);
    if (result.success) {
      showEditDataModal.value = false;
      editingData.value = null;
      loadTableData();
      showToast('数据更新成功');
    } else {
      showToast(result.message || '更新失败', 'error');
    }
  }
};

const openDeleteDataModal = (rowIndex: number) => {
  editingData.value = {index: rowIndex, row: dataList.value[rowIndex]};
  showDeleteDataModal.value = true;
};

const handleDeleteData = () => {
  if (currentTable.value.tableName && editingData.value) {
    const primaryKeyColumn = columnList.value.find(col => col.primitiveKey);
    const row = dataList.value[editingData.value.index];

    let where = Where.of();
    if (primaryKeyColumn) {
      const pkValue = row[primaryKeyColumn.name];
      where = where.eq(primaryKeyColumn.name, pkValue);
    }

    const result = props.dataService.deleteData(currentTable.value.tableName, where);
    if (result.success) {
      showDeleteDataModal.value = false;
      editingData.value = null;
      loadTableData();
      showToast('数据删除成功');
    } else {
      showToast(result.message || '删除失败', 'error');
    }
  }
};

const handleRowSelect = (rowIndex: number) => {
  if (selectedRows.value.has(rowIndex)) {
    selectedRows.value.delete(rowIndex);
  } else {
    selectedRows.value.add(rowIndex);
  }
  if (selectedRows.value.size > 0) {
    batchDeleteMode.value = 'confirming';
  } else {
    batchDeleteMode.value = 'selecting';
  }
};

const handleSelectAll = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.checked) {
    dataList.value.forEach((_, index) => selectedRows.value.add(index));
  } else {
    selectedRows.value.clear();
  }
  if (selectedRows.value.size > 0) {
    batchDeleteMode.value = 'confirming';
  } else {
    batchDeleteMode.value = 'selecting';
  }
};

const handleBatchDelete = () => {
  if (batchDeleteMode.value === 'none') {
    batchDeleteMode.value = 'selecting';
    showCheckboxColumn.value = true;
    selectedRows.value.clear();
  } else if (batchDeleteMode.value === 'selecting') {
    batchDeleteMode.value = 'none';
    showCheckboxColumn.value = false;
    selectedRows.value.clear();
  } else if (batchDeleteMode.value === 'confirming') {
    if (selectedRows.value.size === 0) {
      showToast('请先选择要删除的数据', 'error');
      return;
    }

    if (currentTable.value.tableName) {
      let successCount = 0;
      const primaryKeyColumn = columnList.value.find(col => col.primitiveKey);

      selectedRows.value.forEach(rowIndex => {
        const row = dataList.value[rowIndex];
        let where = Where.of();

        if (primaryKeyColumn) {
          const pkValue = row[primaryKeyColumn.name];
          where = where.eq(primaryKeyColumn.name, pkValue);
        }

        const result = props.dataService.deleteData(currentTable.value.tableName, where);
        if (result.success) {
          successCount++;
        }
      });

      selectedRows.value.clear();
      loadTableData();
      showToast(`成功删除 ${successCount} 条数据`);
      batchDeleteMode.value = 'none';
      showCheckboxColumn.value = false;
    }
  }
};

const handleExport = () => {
  if (currentTable.value.tableName) {
    exportedSql.value = props.dataService.export(currentTable.value.tableName);
    showExportModal.value = true;
  }
};

watch(() => props.selectedTable, () => {
  loadTableData();
});

onMounted(() => {
  loadTableData();
});
</script>

<style scoped lang="less">
.chat-data-management-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.data-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.data-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.data-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
}

.table-comment {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.data-actions {
  display: flex;
  gap: 8px;
}

.data-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-container {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--SmartThemeBlurTintColor);
}

thead th {
  padding: 12px 16px;
  border-bottom: 2px solid var(--SmartThemeBorderColor);
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
  white-space: nowrap;
  background: var(--SmartThemeBlurTintColor);
}

tbody th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
  white-space: nowrap;
}

.checkbox-header {
  width: 50px;
  text-align: center;
  padding: 12px 8px;
}

.column-header {
  min-width: 120px;
}

.actions-header {
  width: 100px;
  text-align: center;
  padding: 12px 8px;
}

.sticky-col {
  position: sticky;
  background: var(--SmartThemeBlurTintColor);
  z-index: 20;
  left: 0;
}

thead th.sticky-col {
  z-index: 32;
  left: 0;
}

.primary-key {
  background: color-mix(in srgb, rgba(218, 165, 32, 0.15) 50%, var(--SmartThemeBlurTintColor));
  border-right: 2px solid color-mix(in srgb, rgba(218, 165, 32, 0.3) 50%, var(--SmartThemeBorderColor));
}

thead th.primary-key {
  background: color-mix(in srgb, rgba(218, 165, 32, 0.2) 50%, var(--SmartThemeBlurTintColor));
}

thead th.actions-header.sticky-col {
  z-index: 31;
}

thead th.checkbox-header.sticky-col {
  z-index: 32;
}

.table-row {
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  transition: background-color 0.2s;

  &:hover {
    background-color: color-mix(in srgb, var(--SmartThemeBorderColor) 20%, transparent);
  }

  &:last-child {
    border-bottom: none;
  }
}

.table-cell {
  padding: 10px 16px;
  border-right: 1px solid var(--SmartThemeBorderColor);
  max-width: 300px;
  min-width: 120px;
  background: var(--SmartThemeBlurTintColor);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:last-child {
    border-right: none;
  }
}

.table-cell.primary-key {
  background: color-mix(in srgb, rgba(59, 130, 246, 0.1) 50%, var(--SmartThemeBlurTintColor));
  border-right: 2px solid color-mix(in srgb, rgba(59, 130, 246, 0.3) 50%, var(--SmartThemeBorderColor));
}

.cell-value {
  color: var(--SmartThemeBodyColor);
  text-align: center;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.checkbox-cell {
  width: 50px;
  text-align: center;
  padding: 10px 8px;
  border-right: 1px solid var(--SmartThemeBorderColor);
}

.actions-cell {
  width: 100px;
  padding: 10px 8px;
  text-align: center;
  border-right: 1px solid var(--SmartThemeBorderColor);
}

.actions-cell.sticky-col {
  box-shadow: 3px 0 10px -3px rgba(0, 0, 0, 0.25);
}

.checkbox-cell.sticky-col {
  box-shadow: 2px 0 10px -3px rgba(0, 0, 0, 0.15);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.row-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

@media (max-width: 768px) {
  .data-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }

  .data-title {
    align-items: flex-start;
  }

  .data-actions {
    width: 100%;

    > button {
      flex: 1;
    }
  }

  thead th, .table-cell {
    padding: 8px 10px;
  }

  .column-header {
    min-width: 80px;
  }

  .table-cell {
    max-width: 150px;
    min-width: 80px;
  }

  .actions-header, .actions-cell {
    width: 70px;
  }
}
</style>
