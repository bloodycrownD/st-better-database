<template>
  <div class="template-management-tab">
    <div class="tab-toolbar">
      <Button @click="showCreateTableModal = true">
        <i class="fa-solid fa-plus" style="margin-right: 6px;"></i>
        创建表
      </Button>
      <Button @click="handleRefresh">
        <i class="fa-solid fa-rotate" style="margin-right: 6px;"></i>
        刷新
      </Button>
    </div>

    <div v-if="!selectedTable" class="empty-state">
      <i class="fa-solid fa-table"></i>
      <span>请选择一个表格进行管理</span>
    </div>

    <div v-else class="table-detail">
      <div class="table-header">
        <div class="table-title-section">
          <div class="table-name-row">
            <span class="table-label">表名：</span>
            <span class="table-name">{{ currentTable.tableName }}</span>
            <Button size="small" @click="showEditTableNameModal = true">
              <i class="fa-solid fa-pen"></i>
            </Button>
          </div>
          <div v-if="currentTable.comment" class="table-comment-row">
            <span class="table-label">注释：</span>
            <span class="table-comment">{{ currentTable.comment }}</span>
            <Button size="small" @click="showEditTableCommentModal = true">
              <i class="fa-solid fa-pen"></i>
            </Button>
          </div>
        </div>
        <div class="table-actions">
          <Button @click="handleExportDDL">
            <i class="fa-solid fa-download" style="margin-right: 6px;"></i>
            导出DDL
          </Button>
          <Button type="danger" @click="showDropTableModal = true">
            <i class="fa-solid fa-trash" style="margin-right: 6px;"></i>
            删除表
          </Button>
        </div>
      </div>

      <div class="columns-section">
        <div class="section-header">
          <span class="section-title">列结构</span>
          <Button size="small" @click="showAddColumnModal = true">
            <i class="fa-solid fa-plus" style="margin-right: 4px;"></i>
            添加列
          </Button>
        </div>
        <div class="columns-list">
          <div v-for="[fieldId, column] in columnList" :key="fieldId" class="column-item">
            <div class="column-info">
              <div class="column-name-row">
                <i class="fa-solid fa-hashtag column-icon"></i>
                <span class="column-name">{{ column.name }}</span>
                <i v-if="column.primitiveKey" class="fa-solid fa-key primary-key-icon"></i>
                <Button size="small" @click="openEditColumnNameModal(fieldId, column)">
                  <i class="fa-solid fa-pen"></i>
                </Button>
              </div>
              <div class="column-type">
                <span class="type-badge">{{ column.type }}</span>
                <span v-if="column.defaultValue !== undefined" class="default-value">
                  默认: {{ formatValue(column.defaultValue) }}
                </span>
              </div>
              <div v-if="column.comment" class="column-comment">{{ column.comment }}</div>
            </div>
            <div class="column-actions">
              <Button v-if="column.comment" size="small" @click="openEditColumnCommentModal(fieldId, column)">
                <i class="fa-solid fa-comment"></i>
              </Button>
              <Button type="danger" size="small" @click="openDropColumnModal(fieldId, column)">
                <i class="fa-solid fa-trash"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PopupModal v-if="showCreateTableModal" visible title="创建表" @close="showCreateTableModal = false">
      <CreateTableForm @create="handleCreateTable" @cancel="showCreateTableModal = false" />
    </PopupModal>

    <PopupModal v-if="showEditTableNameModal" visible title="修改表名" @close="showEditTableNameModal = false">
      <EditTableNameForm :table-name="currentTable.tableName" @save="handleEditTableName" @cancel="showEditTableNameModal = false" />
    </PopupModal>

    <PopupModal v-if="showEditTableCommentModal" visible title="修改表注释" @close="showEditTableCommentModal = false">
      <EditTableCommentForm :comment="currentTable.comment" @save="handleEditTableComment" @cancel="showEditTableCommentModal = false" />
    </PopupModal>

    <PopupModal v-if="showDropTableModal" visible title="删除表" @close="showDropTableModal = false">
      <DropTableConfirm :table-name="currentTable.tableName" @confirm="handleDropTable" @cancel="showDropTableModal = false" />
    </PopupModal>

    <PopupModal v-if="showAddColumnModal" visible title="添加列" @close="showAddColumnModal = false">
      <AddColumnForm @create="handleAddColumn" @cancel="showAddColumnModal = false" />
    </PopupModal>

    <PopupModal v-if="showEditColumnNameModal && editingColumn" visible title="修改列名" @close="showEditColumnNameModal = false">
      <EditColumnNameForm :column="editingColumn.column" @save="handleEditColumnName" @cancel="showEditColumnNameModal = false" />
    </PopupModal>

    <PopupModal v-if="showEditColumnCommentModal && editingColumn" visible title="修改列注释" @close="showEditColumnCommentModal = false">
      <EditColumnCommentForm :column="editingColumn.column" @save="handleEditColumnComment" @cancel="showEditColumnCommentModal = false" />
    </PopupModal>

    <PopupModal v-if="showDropColumnModal && editingColumn" visible title="删除列" @close="showDropColumnModal = false">
      <DropColumnConfirm :column="editingColumn.column" @confirm="handleDropColumn" @cancel="showDropColumnModal = false" />
    </PopupModal>

    <PopupModal v-if="showDDLModal" visible title="DDL语句" @close="showDDLModal = false">
      <DDLDisplay :ddl="exportedDDL" @close="showDDLModal = false" />
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import Button from '../shared/Button.vue';
import PopupModal from '../shared/PopupModal.vue';
import type {TableSchema, ColumnSchema} from '@/infra/sql';
import type {TableManagementService} from '@/service/interfaces/table-management-service';
import CreateTableForm from './forms/CreateTableForm.vue';
import EditTableNameForm from './forms/EditTableNameForm.vue';
import EditTableCommentForm from './forms/EditTableCommentForm.vue';
import DropTableConfirm from './forms/DropTableConfirm.vue';
import AddColumnForm from './forms/AddColumnForm.vue';
import EditColumnNameForm from './forms/EditColumnNameForm.vue';
import EditColumnCommentForm from './forms/EditColumnCommentForm.vue';
import DropColumnConfirm from './forms/DropColumnConfirm.vue';
import DDLDisplay from './forms/DDLDisplay.vue';

interface Props {
  tableService: TableManagementService;
  selectedTable?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const currentTable = computed<TableSchema>(() => {
  const tables = props.tableService.getTables();
  return tables.find(t => t.tableName === props.selectedTable) || {} as TableSchema;
});

const columnList = computed<Array<[number, ColumnSchema]>>(() => {
  return Array.from(currentTable.value.columnSchemas.entries());
});

const showCreateTableModal = ref(false);
const showEditTableNameModal = ref(false);
const showEditTableCommentModal = ref(false);
const showDropTableModal = ref(false);
const showAddColumnModal = ref(false);
const showEditColumnNameModal = ref(false);
const showEditColumnCommentModal = ref(false);
const showDropColumnModal = ref(false);
const showDDLModal = ref(false);

const editingColumn = ref<{fieldId: number; column: ColumnSchema} | null>(null);
const exportedDDL = ref('');

const handleRefresh = () => {
  emit('refresh');
};

const formatValue = (value: any): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  return String(value);
};

const handleCreateTable = (data: {tableName: string; columns: ColumnSchema[]; comment?: string}) => {
  props.tableService.createTable(data.tableName, data.columns);
  showCreateTableModal.value = false;
  emit('refresh');
};

const handleEditTableName = (newName: string) => {
  if (currentTable.value.tableName) {
    props.tableService.alterTableName(currentTable.value.tableName, newName);
    showEditTableNameModal.value = false;
    emit('refresh');
  }
};

const handleEditTableComment = (comment: string) => {
  if (currentTable.value.tableName) {
    props.tableService.alterTableComment(currentTable.value.tableName, comment);
    showEditTableCommentModal.value = false;
    emit('refresh');
  }
};

const handleDropTable = () => {
  if (currentTable.value.tableName) {
    props.tableService.dropTable(currentTable.value.tableName);
    showDropTableModal.value = false;
    emit('refresh');
  }
};

const handleAddColumn = (column: ColumnSchema) => {
  if (currentTable.value.tableName) {
    props.tableService.addColumn(currentTable.value.tableName, column.name, column);
    showAddColumnModal.value = false;
    emit('refresh');
  }
};

const openEditColumnNameModal = (fieldId: number, column: ColumnSchema) => {
  editingColumn.value = {fieldId, column};
  showEditColumnNameModal.value = true;
};

const handleEditColumnName = (newName: string) => {
  if (currentTable.value.tableName && editingColumn.value) {
    props.tableService.alterColumnName(currentTable.value.tableName, editingColumn.value.column.name, newName);
    showEditColumnNameModal.value = false;
    editingColumn.value = null;
    emit('refresh');
  }
};

const openEditColumnCommentModal = (fieldId: number, column: ColumnSchema) => {
  editingColumn.value = {fieldId, column};
  showEditColumnCommentModal.value = true;
};

const handleEditColumnComment = (comment: string) => {
  if (currentTable.value.tableName && editingColumn.value) {
    props.tableService.alterColumnComment(currentTable.value.tableName, editingColumn.value.column.name, comment);
    showEditColumnCommentModal.value = false;
    editingColumn.value = null;
    emit('refresh');
  }
};

const openDropColumnModal = (fieldId: number, column: ColumnSchema) => {
  editingColumn.value = {fieldId, column};
  showDropColumnModal.value = true;
};

const handleDropColumn = () => {
  if (currentTable.value.tableName && editingColumn.value) {
    props.tableService.dropColumn(currentTable.value.tableName, editingColumn.value.column.name);
    showDropColumnModal.value = false;
    editingColumn.value = null;
    emit('refresh');
  }
};

const handleExportDDL = () => {
  if (currentTable.value.tableName) {
    exportedDDL.value = props.tableService.export(currentTable.value.tableName);
    showDDLModal.value = true;
  }
};
</script>

<style scoped lang="less">
.template-management-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tab-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);

  i {
    font-size: 48px;
  }

  span {
    font-size: 14px;
  }
}

.table-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  padding: 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.table-title-section {
  margin-bottom: 12px;
}

.table-name-row,
.table-comment-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.table-label {
  font-size: 13px;
  color: var(--SmartThemeEmColor);
  min-width: 50px;
}

.table-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
  flex: 1;
}

.table-comment {
  font-size: 14px;
  color: var(--SmartThemeEmColor);
  flex: 1;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.columns-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
}

.columns-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.column-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  margin-bottom: 8px;
}

.column-info {
  flex: 1;
  min-width: 0;
}

.column-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.column-icon {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.column-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--SmartThemeBodyColor);
  flex: 1;
}

.primary-key-icon {
  font-size: 12px;
  color: #f59e0b;
}

.column-type {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
  color: var(--SmartThemeEmColor);
}

.default-value {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.column-comment {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  margin-top: 4px;
}

.column-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .tab-toolbar {
    flex-wrap: wrap;
  }

  .table-header {
    padding: 12px;
  }

  .table-name-row,
  .table-comment-row {
    flex-wrap: wrap;
  }

  .table-actions {
    width: 100%;
    justify-content: stretch;

    > button {
      flex: 1;
    }
  }

  .section-header {
    padding: 10px 12px;
  }

  .column-item {
    flex-direction: column;
    gap: 8px;
  }

  .column-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
