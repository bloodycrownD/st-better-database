<template>
  <div class="table-list-drawer">
    <div class="drawer-header">
      <span class="drawer-title">表格列表</span>
    </div>
    <div class="drawer-body">
      <div v-if="tables.length === 0" class="empty-state">
        <i class="fa-solid fa-table"></i>
        <span>暂无表格</span>
      </div>
      <div v-else class="table-list">
        <div
          v-for="table in tables"
          :key="table.tableName"
          :class="['table-item', { active: selectedTable === table.tableName }]"
          @click="handleTableClick(table.tableName)"
        >
          <div class="table-item-main">
            <i class="fa-solid fa-table table-icon"></i>
            <span class="table-name">{{ table.tableName }}</span>
          </div>
          <div v-if="table.comment" class="table-comment">{{ table.comment }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {TableSchema} from '@/infra/sql';

interface Props {
  tables: TableSchema[];
  selectedTable?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [tableName: string];
}>();

const handleTableClick = (tableName: string) => {
  emit('select', tableName);
};
</script>

<style scoped lang="less">
.table-list-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  border-right: 1px solid var(--SmartThemeBorderColor);
}

.drawer-header {
  padding: 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.drawer-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);

  i {
    font-size: 32px;
  }

  span {
    font-size: 14px;
  }
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-item {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
  }

  &.active {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 70%, transparent);
    border-color: var(--SmartThemeBorderColor);
  }
}

.table-item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.table-icon {
  font-size: 14px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
}

.table-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--SmartThemeBodyColor);
  flex: 1;
}

.table-comment {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  margin-left: 22px;
}

@media (max-width: 768px) {
  .table-list-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50vh;
    border-right: none;
    border-top: 1px solid var(--black20a);
    border-radius: 12px 12px 0 0;
    z-index: 1002;
  }

  .drawer-header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &::after {
      content: '';
      width: 40px;
      height: 4px;
      background: var(--black50a);
      border-radius: 2px;
    }
  }

  .drawer-title {
    display: none;
  }
}
</style>
