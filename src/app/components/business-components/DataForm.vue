<template>
  <div class="data-form-wrapper" :style="modalStyle">
    <PopupModal :visible="true" :title="title" :width="computedModalWidth" :height="modalHeight" :closable="false"
                @close="handleCancel">
      <div class="data-form">
        <div class="form-content">
          <div v-for="column in columns" :key="column.name" class="form-item">
            <label class="form-label">
              {{ column.name }}
              <span v-if="column.primitiveKey" class="required-mark">*</span>
            </label>
            <input
                v-if="!isTextType(column.type)"
                v-model="formData[column.name]"
                :type="getInputType(column.type)"
                class="form-input"
            />
            <AutoResizeTextarea
                v-else
                :model-value="String(formData[column.name] || '')"
                @update:model-value="(val: string) => formData[column.name] = val"
                :min-rows="1"
                :max-rows="10"
            />
          </div>
        </div>
        <div class="form-actions">
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" @click="handleSubmit">确定</Button>
        </div>
      </div>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
import AutoResizeTextarea from '@/app/components/pure-components/AutoResizeTextarea.vue';
import type {ColumnSchema, SqlValue} from '@/infra/sql';

interface Props {
  columns: ColumnSchema[];
  initialData?: any;
  title?: string;
  modalWidth?: string;
  modalHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '数据表单',
  modalWidth: '50vw',
  modalHeight: 'auto'
});

const emit = defineEmits<{
  submit: [data: Map<string, SqlValue>];
  cancel: [];
}>();

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
  return isMobile.value ? '100%' : props.modalWidth;
});

const modalStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.modalWidth) {
    style['--form-modal-width'] = isMobile.value ? '100%' : props.modalWidth;
  }
  if (props.modalHeight) {
    style['--form-modal-height'] = props.modalHeight;
  }
  return style;
});

const formData = reactive<Record<string, SqlValue>>({});

const initFormData = () => {
  props.columns.forEach(column => {
    if (props.initialData && props.initialData[column.name] !== undefined) {
      formData[column.name] = props.initialData[column.name];
    } else if (column.defaultValue !== undefined) {
      formData[column.name] = column.defaultValue;
    } else {
      formData[column.name] = '' as SqlValue;
    }
  });
};

const isTextType = (columnType: string): boolean => {
  const upperType = columnType.toUpperCase();
  return upperType.includes('STRING') || upperType.includes('TEXT');
};

const getInputType = (columnType: string): string => {
  if (columnType.toUpperCase().includes('INT')) {
    return 'number';
  }
  if (columnType.toUpperCase().includes('REAL') || columnType.toUpperCase().includes('FLOA') || columnType.toUpperCase().includes('DOUB')) {
    return 'number';
  }
  return 'text';
};

const handleSubmit = () => {
  const data = new Map<string, SqlValue>();
  props.columns.forEach(column => {
    let rawValue = formData[column.name];
    let value: SqlValue;

    if (rawValue === '' || rawValue === undefined) {
      if (!column.primitiveKey) {
        value = null as SqlValue;
      } else if (column.defaultValue !== undefined) {
        value = column.defaultValue;
      } else {
        value = null as SqlValue;
      }
    } else {
      value = rawValue as SqlValue;
    }

    const columnType = column.type.toUpperCase();
    if (columnType.includes('INT') && value !== null) {
      value = parseInt(String(value)) as SqlValue;
    } else if ((columnType.includes('REAL') || columnType.includes('FLOA') || columnType.includes('DOUB')) && value !== null) {
      value = parseFloat(String(value)) as SqlValue;
    }

    data.set(column.name, value);
  });

  emit('submit', data);
};

const handleCancel = () => {
  emit('cancel');
};

watch(() => props.initialData, () => {
  initFormData();
}, {immediate: true});
</script>

<style scoped lang="less">
.data-form-wrapper {
  --form-modal-width: 50vw;
  --form-modal-height: auto;
}

.data-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 65vh;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding: 8px 4px;
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

.required-mark {
  color: #ef4444;
  margin-left: 4px;
  font-size: 14px;
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
  }
}

.form-hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 45%, transparent);
  margin-top: -4px;
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
  .data-form-wrapper {
    --form-modal-width: 100%;
  }

  .data-form {
    gap: 20px;
    max-height: 70vh;
  }

  .form-content {
    gap: 16px;
    padding: 4px;
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

  .form-hint {
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
