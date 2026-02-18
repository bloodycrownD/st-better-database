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
          <div v-else class="table-comment-row">
            <span class="table-label">注释：</span>
            <span class="table-comment placeholder">暂无注释</span>
            <Button size="small" @click="showEditTableCommentModal = true">
              <i class="fa-solid fa-plus"></i>
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
          <div v-if="columnList.length === 0" class="columns-empty">
            <i class="fa-solid fa-columns"></i>
            <span>暂无列定义</span>
          </div>
          <div v-else>
            <div v-for="[fieldId, column] in columnList" :key="fieldId" class="column-item">
              <div class="column-info">
                <div class="column-name-row">
                  <i class="fa-solid fa-hashtag column-icon"></i>
                  <span class="column-name">{{ column.name }}</span>
                  <i v-if="column.primitiveKey" class="fa-solid fa-key primary-key-icon" title="主键"></i>
                </div>
                <div class="column-meta">
                  <span class="type-badge">{{ column.type }}</span>
                  <span v-if="column.defaultValue !== undefined" class="default-value">
                    默认: {{ formatValue(column.defaultValue) }}
                  </span>
                </div>
                <div v-if="column.comment" class="column-comment">{{ column.comment }}</div>
              </div>
              <div class="column-actions">
                <Button size="small" title="修改列名" @click="openEditColumnNameModal(fieldId, column)">
                  <i class="fa-solid fa-pen"></i>
                </Button>
                <Button size="small" title="修改注释" @click="openEditColumnCommentModal(fieldId, column)">
                  <i class="fa-solid fa-comment"></i>
                </Button>
                <Button type="danger" size="small" title="删除列" @click="openDropColumnModal(fieldId, column)">
                  <i class="fa-solid fa-trash"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <Transition name="toast">
      <div v-if="toast.visible" class="toast-notification" :class="toast.type">
        <i :class="toast.icon"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- 创建表模态框 -->
    <PopupModal v-if="showCreateTableModal" visible title="创建表" @close="showCreateTableModal = false">
      <CreateTableForm
        :existing-tables="tables"
        @create="handleCreateTable"
        @cancel="showCreateTableModal = false"
      />
    </PopupModal>

    <!-- 修改表名模态框 -->
    <PopupModal v-if="showEditTableNameModal" visible title="修改表名" @close="showEditTableNameModal = false">
      <EditTableNameForm
        :table-name="currentTable.tableName"
        :existing-tables="tables"
        @save="handleEditTableName"
        @cancel="showEditTableNameModal = false"
      />
    </PopupModal>

    <!-- 修改表注释模态框 -->
    <PopupModal v-if="showEditTableCommentModal" visible title="修改表注释" @close="showEditTableCommentModal = false">
      <EditTableCommentForm :comment="currentTable.comment" @save="handleEditTableComment" @cancel="showEditTableCommentModal = false" />
    </PopupModal>

    <!-- 删除表确认模态框 -->
    <PopupModal v-if="showDropTableModal" visible title="删除表" @close="showDropTableModal = false">
      <DropTableConfirm :table-name="currentTable.tableName" @confirm="handleDropTable" @cancel="showDropTableModal = false" />
    </PopupModal>

    <!-- 添加列模态框 -->
    <PopupModal v-if="showAddColumnModal" visible title="添加列" @close="showAddColumnModal = false">
      <AddColumnForm
        :existing-columns="existingColumns"
        @create="handleAddColumn"
        @cancel="showAddColumnModal = false"
      />
    </PopupModal>

    <!-- 修改列名模态框 -->
    <PopupModal v-if="showEditColumnNameModal && editingColumn" visible title="修改列名" @close="showEditColumnNameModal = false">
      <EditColumnNameForm
        :column="editingColumn.column"
        :existing-columns="existingColumnsForEdit"
        @save="handleEditColumnName"
        @cancel="showEditColumnNameModal = false"
      />
    </PopupModal>

    <!-- 修改列注释模态框 -->
    <PopupModal v-if="showEditColumnCommentModal && editingColumn" visible title="修改列注释" @close="showEditColumnCommentModal = false">
      <EditColumnCommentForm :column="editingColumn.column" @save="handleEditColumnComment" @cancel="showEditColumnCommentModal = false" />
    </PopupModal>

    <!-- 删除列确认模态框 -->
    <PopupModal v-if="showDropColumnModal && editingColumn" visible title="删除列" @close="showDropColumnModal = false">
      <DropColumnConfirm :column="editingColumn.column" @confirm="handleDropColumn" @cancel="showDropColumnModal = false" />
    </PopupModal>

    <!-- DDL 显示模态框 -->
    <PopupModal v-if="showDDLModal" visible title="DDL语句" @close="showDDLModal = false">
      <DDLDisplay :ddl="exportedDDL" @close="showDDLModal = false" />
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {computed, reactive, ref} from 'vue';
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
  tables: TableSchema[];
  selectedTable?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
  'update:selectedTable': [tableName: string];
}>();

const currentTable = computed<TableSchema>(() => {
  return props.tables.find(t => t.tableName === props.selectedTable) || {} as TableSchema;
});

const columnList = computed<Array<[number, ColumnSchema]>>(() => {
  if (!currentTable.value.columnSchemas) return [];
  return Array.from(currentTable.value.columnSchemas.entries());
});

// 获取当前表的所有列（用于添加列时的重复校验）
const existingColumns = computed<ColumnSchema[]>(() => {
  if (!currentTable.value.columnSchemas) return [];
  return Array.from(currentTable.value.columnSchemas.values());
});

// 获取当前表的所有列，排除正在编辑的列（用于修改列名时的重复校验）
const existingColumnsForEdit = computed<ColumnSchema[]>(() => {
  if (!currentTable.value.columnSchemas || !editingColumn.value) return [];
  return Array.from(currentTable.value.columnSchemas.values())
    .filter(col => col.name !== editingColumn.value?.column.name);
});

// Toast 通知状态
const toast = reactive({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error',
  icon: 'fa-solid fa-check-circle'
});

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toast.message = message;
  toast.type = type;
  toast.icon = type === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-circle-xmark';
  toast.visible = true;

  toastTimeout = setTimeout(() => {
    toast.visible = false;
  }, 3000);
};

// 模态框状态
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
  showToast('刷新成功');
};

const formatValue = (value: any): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  return String(value);
};

const handleCreateTable = (data: {tableName: string; columns: ColumnSchema[]; comment?: string}) => {
  const result = props.tableService.createTable(data.tableName, data.columns, data.comment);
  if (result.success) {
    showCreateTableModal.value = false;
    emit('refresh');
    showToast(`表 "${data.tableName}" 创建成功`);
  } else {
    showToast(result.message || '创建失败', 'error');
  }
};

const handleEditTableName = (newName: string) => {
  if (currentTable.value.tableName) {
    const result = props.tableService.alterTableName(currentTable.value.tableName, newName);
    if (result.success) {
      showEditTableNameModal.value = false;
      emit('update:selectedTable', newName);
      emit('refresh');
      showToast('表名修改成功');
    } else {
      showToast(result.message || '修改失败', 'error');
    }
  }
};

const handleEditTableComment = (comment: string) => {
  if (currentTable.value.tableName) {
    const result = props.tableService.alterTableComment(currentTable.value.tableName, comment);
    if (result.success) {
      showEditTableCommentModal.value = false;
      emit('refresh');
      showToast('表注释修改成功');
    } else {
      showToast(result.message || '修改失败', 'error');
    }
  }
};

const handleDropTable = () => {
  if (currentTable.value.tableName) {
    const result = props.tableService.dropTable(currentTable.value.tableName);
    if (result.success) {
      showDropTableModal.value = false;
      emit('update:selectedTable', '');
      emit('refresh');
      showToast('表删除成功');
    } else {
      showToast(result.message || '删除失败', 'error');
    }
  }
};

const handleAddColumn = (column: ColumnSchema) => {
  if (currentTable.value.tableName) {
    const result = props.tableService.addColumn(currentTable.value.tableName, column.name, column);
    if (result.success) {
      showAddColumnModal.value = false;
      emit('refresh');
      showToast(`列 "${column.name}" 添加成功`);
    } else {
      showToast(result.message || '添加失败', 'error');
    }
  }
};

const openEditColumnNameModal = (fieldId: number, column: ColumnSchema) => {
  editingColumn.value = {fieldId, column};
  showEditColumnNameModal.value = true;
};

const handleEditColumnName = (newName: string) => {
  if (currentTable.value.tableName && editingColumn.value) {
    const result = props.tableService.alterColumnName(
      currentTable.value.tableName,
      editingColumn.value.column.name,
      newName
    );
    if (result.success) {
      showEditColumnNameModal.value = false;
      editingColumn.value = null;
      emit('refresh');
      showToast('列名修改成功');
    } else {
      showToast(result.message || '修改失败', 'error');
    }
  }
};

const openEditColumnCommentModal = (fieldId: number, column: ColumnSchema) => {
  editingColumn.value = {fieldId, column};
  showEditColumnCommentModal.value = true;
};

const handleEditColumnComment = (comment: string) => {
  if (currentTable.value.tableName && editingColumn.value) {
    const result = props.tableService.alterColumnComment(
      currentTable.value.tableName,
      editingColumn.value.column.name,
      comment
    );
    if (result.success) {
      showEditColumnCommentModal.value = false;
      editingColumn.value = null;
      emit('refresh');
      showToast('列注释修改成功');
    } else {
      showToast(result.message || '修改失败', 'error');
    }
  }
};

const openDropColumnModal = (fieldId: number, column: ColumnSchema) => {
  editingColumn.value = {fieldId, column};
  showDropColumnModal.value = true;
};

const handleDropColumn = () => {
  if (currentTable.value.tableName && editingColumn.value) {
    const result = props.tableService.dropColumn(
      currentTable.value.tableName,
      editingColumn.value.column.name
    );
    if (result.success) {
      showDropColumnModal.value = false;
      editingColumn.value = null;
      emit('refresh');
      showToast('列删除成功');
    } else {
      showToast(result.message || '删除失败', 'error');
    }
  }
};

const handleExportDDL = () => {
  if (currentTable.value.tableName) {
    exportedDDL.value = props.tableService.exportDDL(currentTable.value.tableName);
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

  &:last-child {
    margin-bottom: 0;
  }
}

.table-label {
  font-size: 13px;
  color: var(--SmartThemeEmColor);
  min-width: 50px;
  flex-shrink: 0;
}

.table-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
  flex: 1;
  word-break: break-all;
}

.table-comment {
  font-size: 14px;
  color: var(--SmartThemeEmColor);
  flex: 1;
  word-break: break-all;

  &.placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
    font-style: italic;
  }
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

.columns-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);

  i {
    font-size: 32px;
  }

  span {
    font-size: 14px;
  }
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
  transition: all 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
  }
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
  word-break: break-all;
}

.primary-key-icon {
  font-size: 12px;
  color: #f59e0b;
}

.column-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
  flex-wrap: wrap;
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
  word-break: break-all;
}

.column-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

// Toast 通知
.toast-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &.success {
    background: #10b981;
    color: white;
  }

  &.error {
    background: #ef4444;
    color: white;
  }

  i {
    font-size: 16px;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

// 移动端适配
@media (max-width: 768px) {
  .tab-toolbar {
    flex-wrap: wrap;
    padding: 10px 12px;
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
    margin-top: 12px;

    > button {
      flex: 1;
    }
  }

  .section-header {
    padding: 10px 12px;
  }

  .columns-list {
    padding: 8px;
  }

  .column-item {
    flex-direction: column;
    gap: 12px;
  }

  .column-actions {
    width: 100%;
    justify-content: flex-end;
    border-top: 1px solid var(--SmartThemeBorderColor);
    padding-top: 12px;
    margin-top: 4px;
  }

  .toast-notification {
    left: 16px;
    right: 16px;
    transform: none;
    justify-content: center;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-20px);
  }
}
</style>
