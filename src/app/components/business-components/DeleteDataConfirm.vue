<template>
  <div class="delete-data-confirm-wrapper" :style="modalStyle">
    <PopupModal :visible="true" title="删除数据" :width="modalWidth" :height="modalHeight" :closable="false"
                @close="handleCancel">
      <div class="confirm-container">
        <div class="confirm-content">
          <i class="fa-solid fa-triangle-exclamation warning-icon"></i>
          <p class="confirm-message">确定要删除这条数据吗？此操作无法撤销。</p>
        </div>
        <div class="form-actions">
          <Button @click="handleCancel">取消</Button>
          <Button type="danger" @click="handleConfirm">删除</Button>
        </div>
      </div>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';

const props = defineProps<{
  modalWidth?: string;
  modalHeight?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const modalStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.modalWidth) {
    style['--confirm-modal-width'] = props.modalWidth;
  }
  if (props.modalHeight) {
    style['--confirm-modal-height'] = props.modalHeight;
  }
  return style;
});

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="less">
.delete-data-confirm-wrapper {
  --confirm-modal-width: 500px;
  --confirm-modal-height: auto;
}

.confirm-container {
  padding: 20px;
}

.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #f59e0b;
}

.confirm-message {
  font-size: 14px;
  color: var(--SmartThemeBodyColor);
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .delete-data-confirm-wrapper {
    --confirm-modal-width: 90vw;
  }

  .confirm-container {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;

    > button {
      width: 100%;
    }
  }
}
</style>
