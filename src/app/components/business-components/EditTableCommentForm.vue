<template>
  <div class="form-container">
    <div class="form-item">
      <label class="form-label">表注释</label>
      <textarea
          v-model="comment"
          class="form-textarea"
          rows="4"
          placeholder="请输入表注释（可选）"
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
import Button from '@/app/components/pure-components/Button.vue';

const props = defineProps<{
  comment?: string;
}>();

const emit = defineEmits<{
  save: [comment: string];
  cancel: [];
}>();

const comment = ref(props.comment || '');
const isSubmitting = ref(false);

const handleSave = () => {
  isSubmitting.value = true;
  emit('save', comment.value);
  isSubmitting.value = false;
};

const handleCancel = () => {
  comment.value = props.comment || '';
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
  min-height: 80px;
  transition: all 0.2s;
  font-family: inherit;

  &:focus {
    border-color: var(--SmartThemeBorderColor);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }
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
