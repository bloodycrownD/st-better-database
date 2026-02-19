<template>
  <div class="export-container">
    <div class="export-header">
      <span class="export-title">导出SQL</span>
      <button class="copy-btn" @click="handleCopy">
        <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'"></i>
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <div class="export-content">
      <pre class="export-code">{{ sql }}</pre>
    </div>
    <div class="form-actions">
      <Button @click="handleClose">关闭</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Button from '@/app/components/pure-components/Button.vue';

const props = defineProps<{
  sql: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const copied = ref(false);
let copyTimeout: ReturnType<typeof setTimeout> | null = null;

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.sql);
    copied.value = true;

    if (copyTimeout) {
      clearTimeout(copyTimeout);
    }

    copyTimeout = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped lang="less">
.export-container {
  padding: 20px;
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.export-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeEmColor);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    color: var(--SmartThemeBodyColor);
  }

  i {
    font-size: 12px;
  }
}

.export-content {
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow: auto;
}

.export-code {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--SmartThemeBodyColor);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .export-container {
    padding: 16px;
  }

  .export-content {
    padding: 12px;
    max-height: 300px;
  }

  .export-code {
    font-size: 12px;
  }

  .form-actions {
    > * {
      width: 100%;
    }
  }
}
</style>
