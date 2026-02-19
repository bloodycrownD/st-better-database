<template>
  <div class="form-container">
    <div class="form-section">
      <div class="form-item">
        <label class="form-label">
          表名
          <span class="required">*</span>
        </label>
        <input
          v-model="formData.tableName"
          class="form-input"
          :class="{ 'has-error': getFieldError('tableName') }"
          type="text"
          placeholder="请输入表名（如：user_info）"
        />
        <div v-if="getFieldError('tableName')" class="field-error">
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ getFieldError('tableName') }}
        </div>
        <div class="field-hint">只能包含字母、数字和下划线，不能以数字开头</div>
      </div>

      <div class="form-item">
        <label class="form-label">注释</label>
        <input
          v-model="formData.comment"
          class="form-input"
          type="text"
          placeholder="请输入表注释（可选）"
        />
        <div class="field-hint">描述表的用途，便于理解</div>
      </div>
    </div>

    <div class="form-section columns-section">
      <div class="section-header">
        <label class="form-label">
          列定义
          <span class="required">*</span>
        </label>
        <span class="column-count">{{ formData.columns.length }} 列</span>
      </div>

      <div v-if="getFieldError('columns')" class="field-error section-error">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ getFieldError('columns') }}
      </div>

      <div class="columns-list">
        <div
          v-for="(column, index) in formData.columns"
          :key="column.id"
          class="column-card"
          :class="{ 'has-error': getFieldError(`column_${index}`) }"
        >
          <div class="column-card-header">
            <span class="column-number">#{{ index + 1 }}</span>
            <button class="remove-btn" @click="removeColumn(index)" title="删除此列">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>

          <div class="column-card-body">
            <div class="form-row">
              <div class="form-col form-col-name">
                <label class="field-label">列名 <span class="required">*</span></label>
                <input
                  v-model="column.name"
                  class="form-input"
                  type="text"
                  placeholder="列名"
                />
              </div>
              <div class="form-col form-col-type">
                <label class="field-label">类型</label>
                <select v-model="column.type" class="form-select">
                  <option :value="FieldType.STRING">STRING</option>
                  <option :value="FieldType.NUMBER">NUMBER</option>
                </select>
              </div>
            </div>

            <div v-if="getFieldError(`column_${index}`)" class="field-error">
              <i class="fa-solid fa-circle-exclamation"></i>
              {{ getFieldError(`column_${index}`) }}
            </div>

            <div class="form-row">
              <div class="form-col form-col-default">
                <label class="field-label">默认值</label>
                <input
                  v-model="column.defaultValue"
                  class="form-input"
                  type="text"
                  placeholder="可选"
                />
              </div>
              <div class="form-col form-col-comment">
                <label class="field-label">注释</label>
                <input
                  v-model="column.comment"
                  class="form-input"
                  type="text"
                  placeholder="可选"
                />
              </div>
            </div>

            <label class="checkbox-label">
              <input v-model="column.primitiveKey" type="checkbox" />
              <span>设为主键</span>
            </label>
          </div>
        </div>

        <button class="add-column-btn" @click="addColumn">
          <i class="fa-solid fa-plus"></i>
          <span>添加列</span>
        </button>
      </div>
    </div>

    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" :disabled="isSubmitting" @click="handleCreate">
        <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
        <span>创建</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue';
import Button from '@/app/pure-components/Button.vue';
import type {ColumnSchema, TableSchema} from '@/infra/sql';
import {FieldType} from '@/infra/sql/enums/field-type.ts';
import {useFormValidation} from '../../composables/useFormValidation.ts';

interface Props {
  existingTables?: TableSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  existingTables: () => []
});

const emit = defineEmits<{
  create: [data: {tableName: string; columns: ColumnSchema[]; comment?: string}];
  cancel: [];
}>();

const {getFieldError, validateCreateTableForm, clearErrors} = useFormValidation();
const isSubmitting = ref(false);

interface ColumnFormData extends ColumnSchema {
  id: number;
}

let columnIdCounter = 0;

const formData = reactive({
  tableName: '',
  comment: '',
  columns: [] as ColumnFormData[]
});

const addColumn = () => {
  formData.columns.push({
    id: ++columnIdCounter,
    name: '',
    type: FieldType.STRING,
    primitiveKey: false,
    comment: ''
  });
};

const removeColumn = (index: number) => {
  formData.columns.splice(index, 1);
};

const handleCreate = () => {
  clearErrors();
  isSubmitting.value = true;

  const result = validateCreateTableForm(
    formData.tableName,
    formData.columns,
    props.existingTables
  );

  if (!result.valid) {
    isSubmitting.value = false;
    return;
  }

  // 移除 id 字段，只保留 ColumnSchema 字段
  const columns: ColumnSchema[] = formData.columns.map(col => ({
    name: col.name.trim(),
    type: col.type,
    primitiveKey: col.primitiveKey,
    defaultValue: col.defaultValue || undefined,
    comment: col.comment || undefined
  }));

  emit('create', {
    tableName: formData.tableName.trim(),
    columns,
    comment: formData.comment.trim() || undefined
  });

  isSubmitting.value = false;
};

const handleCancel = () => {
  clearErrors();
  emit('cancel');
};

// 初始添加一列
if (formData.columns.length === 0) {
  addColumn();
}
</script>

<style scoped lang="less">
.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--SmartThemeBodyColor);
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeBodyColor);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: var(--SmartThemeBorderColor);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }

  &.has-error {
    border-color: #ef4444;

    &:focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  }
}

.field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ef4444;

  i {
    font-size: 14px;
  }
}

.section-error {
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  margin-bottom: 8px;
}

.field-hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.columns-section {
  border-top: 1px solid var(--SmartThemeBorderColor);
  padding-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-count {
  font-size: 13px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  padding: 4px 10px;
  border-radius: 12px;
}

.columns-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-card {
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 8px;
  overflow: hidden;

  &.has-error {
    border-color: #ef4444;
  }
}

.column-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 20%, transparent);
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.column-number {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  i {
    font-size: 14px;
  }
}

.column-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.form-col-name {
    flex: 2;
  }

  &.form-col-type {
    flex: 1;
  }

  &.form-col-default,
  &.form-col-comment {
    flex: 1;
  }
}

.field-label {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 70%, transparent);

  .required {
    font-size: 12px;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--SmartThemeEmColor);
  font-size: 13px;
  cursor: pointer;
  width: fit-content;

  input {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
}

.add-column-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed var(--SmartThemeBorderColor);
  border-radius: 8px;
  background: transparent;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 70%, transparent);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--SmartThemeBorderColor);
    color: var(--SmartThemeBodyColor);
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 10%, transparent);
  }

  i {
    font-size: 14px;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--SmartThemeBorderColor);

  button[type="primary"] {
    background: var(--SmartThemeBorderColor);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .form-container {
    padding: 16px;
    gap: 20px;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-col {
    &.form-col-name,
    &.form-col-type,
    &.form-col-default,
    &.form-col-comment {
      flex: 1;
    }
  }

  .column-card-body {
    padding: 12px;
  }

  .form-actions {
    flex-direction: column-reverse;

    > * {
      width: 100%;
    }
  }
}
</style>
