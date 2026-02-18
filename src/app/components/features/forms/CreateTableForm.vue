<template>
  <div class="form-container">
    <div class="form-item">
      <label class="form-label">表名</label>
      <input v-model="formData.tableName" class="form-input" type="text" placeholder="请输入表名" />
    </div>
    <div class="form-item">
      <label class="form-label">注释</label>
      <input v-model="formData.comment" class="form-input" type="text" placeholder="请输入表注释（可选）" />
    </div>
    <div class="form-item">
      <label class="form-label">列定义</label>
      <div class="columns-editor">
        <div v-for="(column, index) in formData.columns" :key="index" class="column-row">
          <input v-model="column.name" class="form-input column-name" type="text" placeholder="列名" />
          <select v-model="column.type" class="form-select column-type">
            <option value="STRING">STRING</option>
            <option value="NUMBER">NUMBER</option>
          </select>
          <label class="checkbox-label">
            <input v-model="column.primitiveKey" type="checkbox" />
            <span>主键</span>
          </label>
          <input v-model="column.defaultValue" class="form-input column-default" type="text" placeholder="默认值（可选）" />
          <input v-model="column.comment" class="form-input column-comment" type="text" placeholder="注释（可选）" />
          <button class="remove-btn" @click="removeColumn(index)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <Button @click="addColumn">
          <i class="fa-solid fa-plus" style="margin-right: 4px;"></i>
          添加列
        </Button>
      </div>
    </div>
    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button @click="handleCreate">创建</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from 'vue';
import Button from '../../shared/Button.vue';
import type {ColumnSchema} from '@/infra/sql';
import {FieldType} from '@/infra/sql/enums/field-type';

const emit = defineEmits<{
  create: [data: {tableName: string; columns: ColumnSchema[]; comment?: string}];
  cancel: [];
}>();

const formData = reactive({
  tableName: '',
  comment: '',
  columns: [] as ColumnSchema[]
});

const addColumn = () => {
  formData.columns.push({
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
  if (!formData.tableName) {
    alert('请输入表名');
    return;
  }
  if (formData.columns.length === 0) {
    alert('请至少添加一列');
    return;
  }
  const hasInvalidColumn = formData.columns.some(col => !col.name);
  if (hasInvalidColumn) {
    alert('请填写所有列名');
    return;
  }
  emit('create', {
    tableName: formData.tableName,
    columns: formData.columns,
    comment: formData.comment || undefined
  });
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="less">
.form-container {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--SmartThemeBodyColor);
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
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--SmartThemeBorderColor);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }
}

.columns-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.column-name {
  flex: 2;
}

.column-type {
  flex: 1;
}

.column-default {
  flex: 2;
}

.column-comment {
  flex: 2;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--SmartThemeEmColor);
  font-size: 13px;

  input {
    cursor: pointer;
  }

  span {
    cursor: pointer;
  }
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #ef4444;
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
