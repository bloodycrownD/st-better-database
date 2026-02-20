<template>
  <div class="form-wrapper" :style="modalStyle">
    <PopupModal :visible="true" title="添加列" :width="computedModalWidth" :height="modalHeight" :closable="false" @close="handleCancel">
      <div class="form-container">
        <div class="form-item">
          <label class="form-label">
            列名
            <span class="required">*</span>
          </label>
          <input
              v-model="columnData.name"
              class="form-input"
              :class="{ 'has-error': getFieldError('columnName') }"
              type="text"
              placeholder="请输入列名（如：username）"
          />
          <div v-if="getFieldError('columnName')" class="field-error">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ getFieldError('columnName') }}
          </div>
          <div class="field-hint">只能包含字母、数字和下划线，不能以数字开头</div>
        </div>

        <div class="form-item">
          <label class="form-label">类型</label>
          <select v-model="columnData.type" class="form-select">
            <option :value="FieldType.STRING">STRING</option>
            <option :value="FieldType.NUMBER">NUMBER</option>
          </select>
        </div>

        <div class="form-item">
          <label class="checkbox-label">
            <input v-model="columnData.primitiveKey" type="checkbox"/>
            <span>设为主键</span>
          </label>
        </div>

        <div class="form-item">
          <label class="form-label">默认值</label>
          <input
              v-model="columnData.defaultValue"
              class="form-input"
              type="text"
              placeholder="请输入默认值（可选）"
          />
          <div class="field-hint">插入数据时该列的默认值</div>
        </div>

        <div class="form-item">
          <label class="form-label">注释</label>
          <AutoResizeTextarea
              v-model="columnData.comment"
              :placeholder="'请输入列注释（可选）'"
              :min-rows="1"
              :max-rows="4"
          />
        </div>

        <div class="form-actions">
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" :disabled="isSubmitting" @click="handleCreate">
            <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin"></i>
            <span>添加</span>
          </Button>
        </div>
      </div>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref, computed, onMounted, onBeforeUnmount} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
import AutoResizeTextarea from '@/app/components/pure-components/AutoResizeTextarea.vue';
import type {ColumnSchema} from '@/infra/sql';
import {FieldType} from '@/infra/sql/enums/field-type.ts';
import {useFormValidation} from '@/app/composables/components-composables/useFormValidation.ts';

interface Props {
  existingColumns?: ColumnSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  existingColumns: () => []
});

const emit = defineEmits<{
  create: [column: ColumnSchema];
  cancel: [];
}>();

const {getFieldError, validateAddColumnForm, clearErrors} = useFormValidation();
const isSubmitting = ref(false);

const columnData = reactive<ColumnSchema>({
  name: '',
  type: FieldType.STRING,
  primitiveKey: false
});

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

const handleCreate = () => {
  clearErrors();
  isSubmitting.value = true;

  const result = validateAddColumnForm(columnData.name, props.existingColumns);

  if (!result.valid) {
    isSubmitting.value = false;
    return;
  }

  const column: ColumnSchema = {
    name: columnData.name.trim(),
    type: columnData.type,
    primitiveKey: columnData.primitiveKey,
    defaultValue: columnData.defaultValue || undefined,
    comment: columnData.comment || undefined
  };

  emit('create', column);
  isSubmitting.value = false;
};

const handleCancel = () => {
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
  max-height: 70vh;
  overflow-y: auto;
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

.form-input,
.form-select {
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--SmartThemeEmColor);
  font-size: 14px;
  cursor: pointer;
  width: fit-content;

  input {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  span {
    cursor: pointer;
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

  .form-input,
  .form-select {
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
