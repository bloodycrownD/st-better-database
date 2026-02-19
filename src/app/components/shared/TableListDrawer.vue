<template>
  <div :class="['table-list-drawer', { 'is-drawer': isDrawer }]">
    <div class="drawer-header">
      <span class="drawer-title">表格列表</span>
      <button class="create-table-btn" title="创建新表" @click="handleCreateClick">
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
    <div class="drawer-body">
      <div v-if="tables.length === 0" class="empty-state">
        <i class="fa-solid fa-table"></i>
        <span>暂无表格</span>
        <button class="empty-create-btn" @click="handleCreateClick">
          <i class="fa-solid fa-plus"></i>
          创建第一个表
        </button>
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
  isDrawer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDrawer: true
});

const emit = defineEmits<{
  select: [tableName: string];
  create: [];
}>();

const handleTableClick = (tableName: string) => {
  emit('select', tableName);
};

const handleCreateClick = () => {
  console.log('[TableListDrawer] Create table button clicked, emitting create event');
  console.log('[TableListDrawer] isDrawer:', props.isDrawer);
  console.log('[TableListDrawer] Emitting create event...');
  emit('create');
  console.log('[TableListDrawer] Create event emitted');
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.drawer-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
}

.create-table-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeEmColor);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
    color: var(--SmartThemeBodyColor);
  }

  i {
    font-size: 13px;
  }
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

.empty-create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 6px;
  background: var(--SmartThemeBlurTintColor);
  color: var(--SmartThemeEmColor);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;

  &:hover {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
    color: var(--SmartThemeBodyColor);
  }

  i {
    font-size: 12px;
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
  word-break: break-all;
}

.table-comment {
  font-size: 12px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  margin-left: 22px;
  word-break: break-all;
}

@media (max-width: 768px) {
  .table-list-drawer.is-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50vh;
    border-right: none;
    border-top: 1px solid var(--black20a);
    border-radius: 12px 12px 0 0;
    z-index: 1002;
    background: var(--SmartThemeBlurTintColor);
  }

  .is-drawer .drawer-header {
    padding: 12px 16px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 4px;
      background: var(--black50a);
      border-radius: 2px;
    }
  }

  .is-drawer .drawer-title {
    display: none;
  }

  .drawer-header {
    flex-direction: row;
    align-items: center;
    padding: 12px;
  }

  .create-table-btn {
    margin-left: 0;
    margin-right: 8px;
  }

  .drawer-body {
    padding: 12px;
  }

  .empty-state {
    height: auto;
    min-height: 150px;
    padding: 20px;
  }

  .table-list {
    gap: 8px;
  }

  .table-item {
    padding: 14px 12px;
  }

  .table-name {
    font-size: 15px;
  }

  .table-comment {
    font-size: 13px;
    margin-top: 4px;
    margin-left: 0;
  }
}
</style>
