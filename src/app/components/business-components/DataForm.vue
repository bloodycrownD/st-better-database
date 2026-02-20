<template>
  <div class="data-form-wrapper" :style="modalStyle">
    <PopupModal :visible="true" :title="title" :width="computedModalWidth" :height="modalHeight" :closable="false" @close="handleCancel">
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
                :placeholder="column.comment || `请输入${column.name}`"
                class="form-input"
            />
            <textarea
                v-else
                v-model="formData[column.name]"
                :placeholder="column.comment || `请输入${column.name}`"
                class="form-textarea"
                rows="4"
            ></textarea>
            <div v-if="column.comment" class="form-hint">{{ column.comment }}</div>
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
import {reactive, watch, computed, ref, onMounted, onBeforeUnmount} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
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
  gap: 16px;
  max-height: 500px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 4px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--SmartThemeBodyColor);
}

.required-mark {
  color: #ef4444;
  margin-left: 2px;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeBodyColor);
  font-size: 13px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }
}

.form-textarea {
  padding: 10px 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeBodyColor);
  font-size: 13px;
  transition: all 0.2s;
  resize: vertical;
  min-height: 80px;
  max-height: 300px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;

  &:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }
}

.form-hint {
  font-size: 11px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid var(--SmartThemeBorderColor);
}

@media (max-width: 768px) {
  .data-form-wrapper {
    --form-modal-width: 100%;
  }

  .data-form {
    max-height: 400px;
  }

  .form-input {
    font-size: 14px;
    padding: 12px;
  }

  .form-actions {
    flex-direction: column-reverse;

    > button {
      width: 100%;
    }
  }
}
</style>
