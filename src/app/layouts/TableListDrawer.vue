<template>
  <div :class="['table-list-drawer', { 'is-drawer': isDrawer }]">
    <div class="drawer-header">
      <span class="drawer-title">表格列表</span>
      <div class="header-actions">
        <button v-if="showSyncButtons" class="sync-btn" title="从模板同步" @click="handleSyncClick">
          <i class="fa-solid fa-rotate"></i>
        </button>
        <button v-if="showSyncButtons" class="push-btn" title="推送至模板" @click="handlePushClick">
          <i class="fa-solid fa-share-from-square"></i>
        </button>
        <button class="create-table-btn" title="创建新表" @click="handleCreateClick">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
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
import {onMounted, onUnmounted, ref} from 'vue';
import type {TableSchema} from '@/infra/sql';

interface Props {
  tables: TableSchema[];
  selectedTable?: string;
  isDrawer?: boolean;
  showSyncButtons?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDrawer: true,
  showSyncButtons: false
});

const emit = defineEmits<{
  select: [tableName: string];
  create: [];
  closeDrawer: [];
  sync: [];
  push: [];
}>();

const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const isMobile = () => windowWidth.value <= 768;

const handleTableClick = (tableName: string) => {
  emit('select', tableName);
  if (isMobile()) {
    emit('closeDrawer');
  }
};

const handleCreateClick = () => {
  emit('create');
};

const handleSyncClick = () => {
  emit('sync');
};

const handlePushClick = () => {
  emit('push');
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sync-btn,
.push-btn {
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
  .drawer-header {
    padding: 12px;
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
