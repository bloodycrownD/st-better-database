<template>
  <div class="form-container">
    <div class="form-item">
      <label class="form-label">列名</label>
      <input :value="column.name" class="form-input" type="text" disabled />
    </div>
    <div class="form-item">
      <label class="form-label">列注释</label>
      <textarea
        v-model="comment"
        class="form-textarea"
        rows="4"
        placeholder="请输入列注释（可选）"
        maxlength="500"
      ></textarea>
      <div class="char-count">{{ comment.length }}/500</div>
    </div>
    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" :disabled="isSubmitting" @click="handleSave">
        <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
        <span>保存</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Button from '@/app/pure-components/Button.vue';
import type {ColumnSchema} from '@/infra/sql';

const props = defineProps<{
  column: ColumnSchema;
}>();

const emit = defineEmits<{
  save: [comment: string];
  cancel: [];
}>();

const comment = ref(props.column.comment || '');
const isSubmitting = ref(false);

const handleSave = () => {
  isSubmitting.value = true;
  emit('save', comment.value);
  isSubmitting.value = false;
};

const handleCancel = () => {
  comment.value = props.column.comment || '';
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
  transition: all 0.2s;
  font-family: inherit;

  &:focus {
    border-color: var(--SmartThemeBorderColor);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }

  &:disabled {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    cursor: not-allowed;
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  margin-top: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--SmartThemeBorderColor);
}

// 移动端适配
@media (max-width: 768px) {
  .form-container {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;

    > * {
      width: 100%;
    }
  }
}
</style>
