<template>
  <div class="form-container">
    <div class="form-item">
      <label class="form-label">当前表名</label>
      <input :value="tableName" class="form-input" type="text" disabled />
    </div>

    <div class="form-item">
      <label class="form-label">
        新表名
        <span class="required">*</span>
      </label>
      <input
        v-model="newTableName"
        class="form-input"
        :class="{ 'has-error': getFieldError('tableName') }"
        type="text"
        placeholder="请输入新表名"
      />
      <div v-if="getFieldError('tableName')" class="field-error">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ getFieldError('tableName') }}
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
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import Button from '@/app/pure-components/Button.vue';
import type {TableSchema} from '@/infra/sql';
import {useFormValidation} from '../../composables/useFormValidation.ts';

interface Props {
  tableName: string;
  existingTables?: TableSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  existingTables: () => []
});

const emit = defineEmits<{
  save: [newName: string];
  cancel: [];
}>();

const {getFieldError, validateEditTableNameForm, clearErrors} = useFormValidation();
const isSubmitting = ref(false);
const newTableName = ref(props.tableName);

const hasChanged = computed(() => {
  return newTableName.value.trim() !== props.tableName;
});

// 当 props.tableName 变化时更新
watch(() => props.tableName, (newVal) => {
  newTableName.value = newVal;
  clearErrors();
});

const handleSave = () => {
  clearErrors();
  isSubmitting.value = true;

  const result = validateEditTableNameForm(
    newTableName.value,
    props.tableName,
    props.existingTables
  );

  if (!result.valid) {
    isSubmitting.value = false;
    return;
  }

  emit('save', newTableName.value.trim());
  isSubmitting.value = false;
};

const handleCancel = () => {
  newTableName.value = props.tableName;
  clearErrors();
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

.required {
  color: #ef4444;
}

.form-input {
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

  &:disabled {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    cursor: not-allowed;
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
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
