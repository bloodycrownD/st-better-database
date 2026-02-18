<template>
  <div class="ddl-container">
    <div class="ddl-content">
      <pre class="ddl-code">{{ ddl }}</pre>
    </div>
    <div class="form-actions">
      <Button @click="handleClose">关闭</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from '../../shared/Button.vue';

const props = defineProps<{
  ddl: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => {
  emit('close');
};
</script>

<style scoped lang="less">
.ddl-container {
  padding: 20px;
}

.ddl-content {
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow: auto;
}

.ddl-code {
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
</style>
