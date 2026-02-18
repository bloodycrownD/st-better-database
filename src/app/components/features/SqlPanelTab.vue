<template>
  <div class="sql-panel-tab">
    <div class="sql-editor-container">
      <div class="sql-toolbar">
        <span class="toolbar-title">SQL编辑器</span>
        <Button @click="handleExecute">
          <i class="fa-solid fa-play" style="margin-right: 6px;"></i>
          执行
        </Button>
      </div>
      <textarea
        v-model="sqlText"
        class="sql-editor"
        placeholder="请输入SQL语句..."
        spellcheck="false"
      ></textarea>
      <div class="sql-footer">
        <div class="editor-stats">
          <span class="stat-item">行数: {{ lineCount }}</span>
          <span class="stat-item">字符: {{ charCount }}</span>
        </div>
        <div v-if="hasResult" class="result-status">
          <span v-if="isQueryResult">结果: {{ resultRows.length }} 行</span>
          <span v-else>影响: {{ result.data }} 行</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import Button from '../shared/Button.vue';
import type {SqlExecutorService} from '@/service/interfaces/sql-executor-service';
import type {SqlResult} from '@/infra/sql';

interface Props {
  sqlExecutorService: SqlExecutorService;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const sqlText = ref('');
const result = ref<SqlResult>({success: false, message: '', data: 0, type: 'DQL' as any});

const lineCount = computed(() => sqlText.value.split('\n').length);
const charCount = computed(() => sqlText.value.length);

const resultRows = computed(() => {
  if (isQueryResult.value && Array.isArray(result.value.data)) {
    return result.value.data;
  }
  return [];
});

const isQueryResult = computed(() => {
  return Array.isArray(result.value.data);
});

const hasResult = computed(() => {
  return result.value.success || result.value.message !== '';
});

const handleExecute = () => {
  if (!sqlText.value.trim()) {
    result.value = {success: false, message: '请输入SQL语句', data: 0, type: 'DQL' as any};
    return;
  }
  try {
    result.value = props.sqlExecutorService.execute(sqlText.value);
    if (result.value.success) {
      emit('refresh');
    }
  } catch (error) {
    result.value = {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
      data: 0,
      type: 'DQL' as any
    };
  }
};
</script>

<style scoped lang="less">
.sql-panel-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  overflow: hidden;
}

.sql-editor-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.sql-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.toolbar-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--SmartThemeEmColor);
}

.sql-editor {
  min-height: 200px;
  max-height: 400px;
  padding: 16px;
  background: var(--SmartThemeBlurTintColor);
  border: none;
  outline: none;
  color: var(--SmartThemeBodyColor);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  overflow-y: auto;

  &::placeholder {
    color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);
  }
}

.sql-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.result-status {
  font-size: 12px;
  font-weight: 500;
  color: var(--SmartThemeBodyColor);
}

.editor-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

@media (max-width: 768px) {
  .sql-panel-tab {
    gap: 12px;
  }

  .sql-editor {
    font-size: 12px;
    min-height: 150px;
  }

  .sql-footer {
    gap: 8px;
  }
}
</style>
