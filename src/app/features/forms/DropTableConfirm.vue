<template>
  <div class="confirm-container">
    <div class="confirm-icon-wrapper">
      <i class="fa-solid fa-triangle-exclamation warning-icon"></i>
    </div>
    <div class="confirm-content">
      <div class="confirm-message">
        确定要删除表 <strong>{{ tableName }}</strong> 吗？
      </div>
      <div class="confirm-warning">
        <i class="fa-solid fa-circle-info"></i>
        <span>此操作不可撤销，表中的所有数据将被永久删除。</span>
      </div>
    </div>
    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button type="danger" :disabled="isSubmitting" @click="handleConfirm">
        <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
        <span>确认删除</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Button from '@/app/components/Button.vue';

const props = defineProps<{
  tableName: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const isSubmitting = ref(false);

const handleConfirm = () => {
  isSubmitting.value = true;
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="less">
.confirm-container {
  padding: 24px 20px;
  text-align: center;
}

.confirm-icon-wrapper {
  margin-bottom: 16px;
}

.warning-icon {
  font-size: 48px;
  color: #f59e0b;
}

.confirm-content {
  margin-bottom: 24px;
}

.confirm-message {
  font-size: 16px;
  color: var(--SmartThemeBodyColor);
  margin-bottom: 12px;
  line-height: 1.5;

  strong {
    color: #ef4444;
    font-weight: 600;
  }
}

.confirm-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  font-size: 13px;
  color: #ef4444;
  text-align: left;

  i {
    font-size: 14px;
    flex-shrink: 0;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

// 移动端适配
@media (max-width: 768px) {
  .confirm-container {
    padding: 20px 16px;
  }

  .warning-icon {
    font-size: 40px;
  }

  .confirm-message {
    font-size: 15px;
  }

  .form-actions {
    flex-direction: column-reverse;

    > * {
      width: 100%;
    }
  }
}
</style>
