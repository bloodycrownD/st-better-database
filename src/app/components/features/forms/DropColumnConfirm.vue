<template>
  <div class="confirm-container">
    <div class="confirm-message">
      <i class="fa-solid fa-triangle-exclamation warning-icon"></i>
      <span>确定要删除列 <strong>{{ column.name }}</strong> 吗？</span>
    </div>
    <div class="confirm-warning">此操作不可撤销，列中的所有数据将被删除。</div>
    <div class="form-actions">
      <Button @click="handleCancel">取消</Button>
      <Button type="danger" @click="handleConfirm">确认删除</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from '../../shared/Button.vue';
import type {ColumnSchema} from '@/infra/sql';

const props = defineProps<{
  column: ColumnSchema;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="less">
.confirm-container {
  padding: 20px;
}

.confirm-message {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: var(--SmartThemeBodyColor);
  margin-bottom: 12px;

  strong {
    color: #ef4444;
  }
}

.warning-icon {
  font-size: 24px;
  color: #f59e0b;
}

.confirm-warning {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  border-radius: 4px;
  font-size: 13px;
  color: #ef4444;
  margin-bottom: 24px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
