<template>
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
      <input
          v-model="columnData.comment"
          class="form-input"
          type="text"
          placeholder="请输入列注释（可选）"
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
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';
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
.form-container {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
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

.required {
  color: #ef4444;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeBodyColor);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: var(--SmartThemeBorderColor);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }

  &.has-error {
    border-color: #ef4444;

    &:focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  }
}

.field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ef4444;
  margin-top: 6px;

  i {
    font-size: 14px;
  }
}

.field-hint {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  margin-top: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--SmartThemeEmColor);
  font-size: 14px;
  cursor: pointer;

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
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--SmartThemeBorderColor);
}

// 移动端适配
@media (max-width: 768px) {
  .form-container {
    padding: 16px;
  }

  .form-item {
    margin-bottom: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;

    > * {
      width: 100%;
    }
  }
}
</style>
