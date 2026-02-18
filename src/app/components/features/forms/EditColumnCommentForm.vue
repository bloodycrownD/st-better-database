<template>
  <div class="form-container">
    <div class="form-item">
      <label class="form-label">列名</label>
      <input :value="column.name" class="form-input" type="text" disabled />
    </div>
    <div class="form-item">
      <label class="form-label">列注释</label>
      <textarea v-model="comment" class="form-textarea" rows="3" placeholder="请输入列注释（可选）"></textarea>
    </div>
    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button @click="handleSave">保存</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Button from '../../shared/Button.vue';
import type {ColumnSchema} from '@/infra/sql';

const props = defineProps<{
  column: ColumnSchema;
}>();

const emit = defineEmits<{
  save: [comment: string];
  cancel: [];
}>();

const comment = ref(props.column.comment || '');

const handleSave = () => {
  emit('save', comment.value);
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
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeBodyColor);
  font-size: 14px;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--SmartThemeBorderColor);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }

  &:disabled {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    cursor: not-allowed;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
