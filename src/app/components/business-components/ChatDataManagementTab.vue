<template>
  <div class="chat-data-management-tab">
    <EmptyState v-if="!selectedTable" icon="fa-solid fa-table" text="请选择一个表格进行管理" />

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
          <Button type="danger" @click="handleBatchDelete" :disabled="selectedRows.size === 0">
            <i class="fa-solid fa-trash" style="margin-right: 6px;"></i>
            批量删除 ({{ selectedRows.size }})
          </Button>
          <Button @click="handleExport">
            <i class="fa-solid fa-download" style="margin-right: 6px;"></i>
            导出
          </Button>
        </div>
      </div>

      <div class="data-list">
        <EmptyState v-if="dataList.length === 0" icon="fa-solid fa-database" text="暂无数据" />
        <div v-else class="data-rows">
          <div v-for="(row, rowIndex) in dataList" :key="rowIndex" class="data-row">
            <label class="checkbox-wrapper">
              <input type="checkbox" :checked="selectedRows.has(rowIndex)" @change="handleRowSelect(rowIndex)" />
            </label>
            <div class="row-actions">
              <Button size="small" @click="openEditDataModal(rowIndex, row)">
                <i class="fa-solid fa-pen"></i>
              </Button>
              <Button type="danger" size="small" @click="openDeleteDataModal(rowIndex)">
                <i class="fa-solid fa-trash"></i>
              </Button>
            </div>
            <div class="row-content">
              <div v-for="[fieldId, value] in getRowData(row, rowIndex)" :key="fieldId" class="data-cell">
                <span class="field-name">{{ fieldId }}</span>
                <span class="field-value">{{ formatValue(value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification
        :visible="toast.visible"
        :message="toast.message"
        :type="toast.type"
        :icon="toast.icon"
    />

    <PopupModal v-if="showAddDataModal" visible title="添加数据" @close="showAddDataModal = false">
      <DataForm
          :columns="columnList"
          @submit="handleAddData"
          @cancel="showAddDataModal = false"
      />
    </PopupModal>

    <PopupModal v-if="showEditDataModal && editingData" visible title="编辑数据" @close="showEditDataModal = false">
      <DataForm
          :columns="columnList"
          :initial-data="editingData.row"
          @submit="handleEditData"
          @cancel="showEditDataModal = false"
      />
    </PopupModal>

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
import type {ColumnSchema, TableSchema, SqlValue} from '@/infra/sql';
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

const dataList = ref<any[]>([]);
const selectedRows = ref<Set<number>>(new Set());
const {toast, showToast} = useToast();

const showAddDataModal = ref(false);
const showEditDataModal = ref(false);
const showDeleteDataModal = ref(false);
const showExportModal = ref(false);
const editingData = ref<{index: number, row: any} | null>(null);
const exportedSql = ref('');

const formatValue = (value: any): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  return String(value);
};

const getRowData = (row: any, rowIndex: number): Array<[string, any]> => {
  if (!Array.isArray(row)) {
    return Object.entries(row).map(([key, value]) => [key, value]);
  }
  return row.map((value, idx) => [`${rowIndex}-${idx}`, value]);
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
};

const handleBatchDelete = () => {
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
  overflow: auto;
  padding: 12px;
}

.data-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  width: 80px;
  flex-shrink: 0;
  cursor: pointer;
  border-right: 1px solid var(--SmartThemeBorderColor);
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--SmartThemeBlurTintColor);
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.data-row {
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  padding: 0;
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  transition: all 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
  }
}

.row-actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 12px;
  width: 80px;
  flex-shrink: 0;
  border-right: 1px solid var(--SmartThemeBorderColor);
  position: sticky;
  left: 80px;
  z-index: 9;
  background: var(--SmartThemeBlurTintColor);
}

.row-content {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  min-width: 0;
}

.data-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  max-width: 300px;
  padding: 12px;
  border-right: 1px solid var(--SmartThemeBorderColor);
  flex-shrink: 0;

  &:last-child {
    border-right: none;
  }
}

.field-name {
  font-size: 11px;
  font-weight: 500;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  text-transform: uppercase;
  flex-shrink: 0;
}

.field-value {
  font-size: 13px;
  color: var(--SmartThemeBodyColor);
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
  overflow-wrap: break-word;
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

  .data-list {
    padding: 8px;
  }

  .data-row {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .row-content {
    margin-right: 0;
    grid-template-columns: 1fr;
  }

  .row-actions {
    width: 100%;
    justify-content: flex-end;
    border-top: 1px solid var(--SmartThemeBorderColor);
    padding-top: 8px;
    margin-top: 4px;
  }
}
</style>
