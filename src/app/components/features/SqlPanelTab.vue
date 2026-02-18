<template>
  <div class="sql-panel-tab">
    <div class="sql-editor-container">
      <div class="sql-toolbar">
        <span class="toolbar-title">SQL编辑器</span>
        <Button @click="handleClear">
          <i class="fa-solid fa-eraser" style="margin-right: 4px;"></i>
          清空
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
        <Button @click="handleExecute">
          <i class="fa-solid fa-play" style="margin-right: 6px;"></i>
          执行
        </Button>
      </div>
    </div>

    <div class="sql-result-container">
      <div class="result-header">
        <span class="result-title">执行结果</span>
        <span :class="['result-status', result.success ? 'success' : 'error']">
          {{ result.success ? '执行成功' : '执行失败' }}
        </span>
      </div>
      <div v-if="result.message" class="result-message">
        {{ result.message }}
      </div>
      <div v-if="result.data !== undefined" class="result-data">
        <div v-if="isQueryResult" class="result-table">
          <div class="result-table-header">
            <div v-for="column in resultColumns" :key="column" class="result-table-cell">
              {{ column }}
            </div>
          </div>
          <div v-for="(row, index) in resultRows" :key="index" class="result-table-row">
            <div v-for="column in resultColumns" :key="column" class="result-table-cell">
              {{ formatCellValue(row.get(column)) }}
            </div>
          </div>
        </div>
        <div v-else class="result-count">
          <span class="count-label">受影响行数:</span>
          <span class="count-value">{{ result.data }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import Button from '../shared/Button.vue';
import type {SqlExecutorService} from '@/service/interfaces/sql-executor-service';
import type {SqlResult, SqlValue} from '@/infra/sql';

interface Props {
  sqlExecutorService: SqlExecutorService;
}

const props = defineProps<Props>();

const sqlText = ref('');
const result = ref<SqlResult>({success: false, message: '', data: 0, type: 'DQL' as any});

const lineCount = computed(() => sqlText.value.split('\n').length);
const charCount = computed(() => sqlText.value.length);

const resultColumns = computed(() => {
  if (isQueryResult.value && Array.isArray(result.value.data) && result.value.data.length > 0) {
    const firstRow = result.value.data[0];
    if (firstRow) {
      return Array.from(firstRow.keys());
    }
  }
  return [];
});

const resultRows = computed(() => {
  if (isQueryResult.value && Array.isArray(result.value.data)) {
    return result.value.data;
  }
  return [];
});

const isQueryResult = computed(() => {
  return Array.isArray(result.value.data);
});

const handleClear = () => {
  sqlText.value = '';
  result.value = {success: false, message: '', data: 0, type: 'DQL' as any};
};

const handleExecute = () => {
  if (!sqlText.value.trim()) {
    result.value = {success: false, message: '请输入SQL语句', data: 0, type: 'DQL' as any};
    return;
  }
  try {
    result.value = props.sqlExecutorService.execute(sqlText.value);
  } catch (error) {
    result.value = {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
      data: 0,
      type: 'DQL' as any
    };
  }
};

const formatCellValue = (value: SqlValue | undefined): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  return String(value);
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
  flex: 1;
  min-height: 200px;
  max-height: 300px;
  padding: 16px;
  background: var(--SmartThemeBlurTintColor);
  border: none;
  outline: none;
  color: var(--SmartThemeBodyColor);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;

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

.editor-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.sql-result-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.result-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--SmartThemeEmColor);
}

.result-status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;

  &.success {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  &.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}

.result-message {
  padding: 12px 16px;
  font-size: 13px;
  color: var(--SmartThemeEmColor);
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: var(--SmartThemeBlurTintColor);
}

.result-data {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.result-table {
  border-collapse: collapse;
  width: 100%;
}

.result-table-header {
  display: flex;
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  z-index: 1;
}

.result-table-row {
  display: flex;
  border-bottom: 1px solid var(--SmartThemeBorderColor);

  &:hover {
    background: var(--SmartThemeBlurTintColor);
  }
}

.result-table-cell {
  flex: 1;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--SmartThemeBodyColor);
  min-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  .result-table-header & {
    font-weight: 500;
    color: var(--SmartThemeEmColor);
  }
}

.result-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.count-label {
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.count-value {
  color: var(--SmartThemeBodyColor);
  font-weight: 600;
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
    flex-direction: column;
    gap: 10px;
  }

  .result-table-cell {
    font-size: 12px;
    min-width: 100px;
  }
}
</style>
