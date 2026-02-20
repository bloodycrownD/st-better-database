<template>
  <div class="form-wrapper" :style="modalStyle">
    <PopupModal :visible="true" title="修改列名" :width="computedModalWidth" :height="modalHeight" :closable="false"
                @close="handleCancel">
      <div class="form-container">
        <div class="form-item">
          <label class="form-label">当前列名</label>
          <input :value="column.name" class="form-input" type="text" disabled/>
        </div>

        <div class="form-item">
          <label class="form-label">
            新列名
            <span class="required">*</span>
          </label>
          <input
              v-model="newColumnName"
              class="form-input"
              :class="{ 'has-error': getFieldError('columnName') }"
              type="text"
              placeholder="请输入新列名"
          />
          <div v-if="getFieldError('columnName')" class="field-error">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ getFieldError('columnName') }}
          </div>
          <div class="field-hint">只能包含字母、数字和下划线，不能以数字开头</div>
        </div>

        <div class="form-actions">
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" :disabled="isSubmitting || !hasChanged" @click="handleSave">
            <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
            <span>保存</span>
          </Button>
        </div>
      </div>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
import type {ColumnSchema} from '@/infra/sql';
import {useFormValidation} from '@/app/composables/components-composables/useFormValidation.ts';

interface Props {
  column: ColumnSchema;
  existingColumns?: ColumnSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  existingColumns: () => []
});

const emit = defineEmits<{
  save: [newName: string];
  cancel: [];
}>();

const {getFieldError, validateEditColumnNameForm, clearErrors} = useFormValidation();
const isSubmitting = ref(false);
const newColumnName = ref(props.column.name);

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

const hasChanged = computed(() => {
  return newColumnName.value.trim() !== props.column.name;
});

// 当 props.column 变化时更新
watch(() => props.column, (newVal) => {
  newColumnName.value = newVal.name;
  clearErrors();
}, {deep: true});

const handleSave = () => {
  clearErrors();
  isSubmitting.value = true;

  const result = validateEditColumnNameForm(
      newColumnName.value,
      props.column.name,
      props.existingColumns
  );

  if (!result.valid) {
    isSubmitting.value = false;
    return;
  }

  emit('save', newColumnName.value.trim());
  isSubmitting.value = false;
};

const handleCancel = () => {
  newColumnName.value = props.column.name;
  clearErrors();
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

.required {
  color: #ef4444;
  margin-left: 4px;
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

  &.has-error {
    border-color: #ef4444;

    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
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

.field-hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 45%, transparent);
  line-height: 1.5;
  padding-left: 2px;
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

  .field-hint {
    font-size: 13px;
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
