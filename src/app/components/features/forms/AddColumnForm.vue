<template>
  <div class="form-container">
    <div class="form-item">
      <label class="form-label">列名</label>
      <input v-model="columnData.name" class="form-input" type="text" placeholder="请输入列名" />
    </div>
    <div class="form-item">
      <label class="form-label">类型</label>
      <select v-model="columnData.type" class="form-select">
        <option value="STRING">STRING</option>
        <option value="NUMBER">NUMBER</option>
      </select>
    </div>
    <div class="form-item">
      <label class="checkbox-label">
        <input v-model="columnData.primitiveKey" type="checkbox" />
        <span>设为主键</span>
      </label>
    </div>
    <div class="form-item">
      <label class="form-label">默认值</label>
      <input v-model="columnData.defaultValue" class="form-input" type="text" placeholder="请输入默认值（可选）" />
    </div>
    <div class="form-item">
      <label class="form-label">注释</label>
      <input v-model="columnData.comment" class="form-input" type="text" placeholder="请输入列注释（可选）" />
    </div>
    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button @click="handleCreate">添加</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from 'vue';
import Button from '../../shared/Button.vue';
import type {ColumnSchema} from '@/infra/sql';
import {FieldType} from '@/infra/sql/enums/field-type';

const emit = defineEmits<{
  create: [column: ColumnSchema];
  cancel: [];
}>();

const columnData = reactive<ColumnSchema>({
  name: '',
  type: FieldType.STRING,
  primitiveKey: false
});

const handleCreate = () => {
  if (!columnData.name) {
    alert('请输入列名');
    return;
  }
  emit('create', {...columnData});
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
  margin-bottom: 16px;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--SmartThemeEmColor);
  font-size: 14px;
  margin-bottom: 8px;

  input {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  span {
    cursor: pointer;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
