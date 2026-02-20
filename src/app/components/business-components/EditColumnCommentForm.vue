<template>
  <div class="form-wrapper" :style="modalStyle">
    <PopupModal :visible="true" title="修改列注释" :width="computedModalWidth" :height="modalHeight" :closable="false" @close="handleCancel">
      <div class="form-container">
        <div class="form-item">
          <label class="form-label">列名</label>
          <input :value="column.name" class="form-input" type="text" disabled/>
        </div>
        <div class="form-item">
          <label class="form-label">列注释</label>
          <AutoResizeTextarea
              v-model="comment"
              :placeholder="'请输入列注释（可选）'"
              :maxlength="500"
              :show-count="true"
              :min-rows="3"
              :max-rows="10"
          />
        </div>
        <div class="form-actions">
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" :disabled="isSubmitting" @click="handleSave">
            <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
            <span>保存</span>
          </Button>
        </div>
      </div>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onBeforeUnmount} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
import AutoResizeTextarea from '@/app/components/pure-components/AutoResizeTextarea.vue';
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

const isMobile = ref(false);

const updateMobileStatus = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  updateMobileStatus();
  window.addEventListener('resize', updateMobileStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileStatus);
});

const computedModalWidth = computed(() => {
  return isMobile.value ? '100%' : '50vw';
});

const modalHeight = 'auto';

const modalStyle = computed(() => {
  const style: Record<string, string> = {};
  style['--form-modal-width'] = isMobile.value ? '100%' : '50vw';
  return style;
});

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
.form-wrapper {
  --form-modal-width: 50vw;
  --form-modal-height: auto;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
  letter-spacing: 0.3px;
}

.form-input {
  padding: 12px 16px;
  border: 1.5px solid var(--SmartThemeBorderColor);
  border-radius: 8px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeBodyColor);
  font-size: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;

  &:hover {
    border-color: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
  }

  &:focus {
    outline: none;
    border-color: var(--SmartThemeEmColor);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--SmartThemeEmColor) 20%, transparent);
    background: var(--SmartThemeBlurTintColor);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 40%, transparent);
    font-size: 13px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 0 8px 0;
  border-top: 1.5px solid var(--SmartThemeBorderColor);
  margin-top: 4px;

  > button {
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@media (max-width: 768px) {
  .form-wrapper {
    --form-modal-width: 100%;
  }

  .form-container {
    gap: 16px;
  }

  .form-item {
    gap: 8px;
  }

  .form-label {
    font-size: 15px;
  }

  .form-input {
    padding: 14px 16px;
    font-size: 16px;
    border-radius: 10px;

    &::placeholder {
      font-size: 15px;
    }
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 10px;
    padding: 16px 0 4px 0;

    > button {
      width: 100%;
      padding: 14px 20px;
      font-size: 15px;
      border-radius: 10px;
    }
  }
}
</style>
