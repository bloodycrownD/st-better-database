<template>
  <div class="table-drawer-layout">
    <div class="layout-content">
      <Transition name="drawer-slide">
        <div v-if="drawerExpanded" class="layout-drawer">
          <TableListDrawer :tables="tables" :selected-table="selectedTable" @select="handleTableSelect"
                           @create="handleCreateTable" @close-drawer="handleCloseDrawer"/>
        </div>
      </Transition>
      <div class="layout-main">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {TableSchema} from '@/infra/sql';
import TableListDrawer from '../layouts/TableListDrawer.vue';

interface Props {
  drawerExpanded: boolean;
  tables: TableSchema[];
  selectedTable?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:drawerExpanded': [value: boolean];
  selectTable: [tableName: string];
  createTable: [];
}>();

const handleTableSelect = (tableName: string) => {
  emit('selectTable', tableName);
};

const handleCreateTable = () => {
  emit('createTable');
};

const handleCloseDrawer = () => {
  emit('update:drawerExpanded', false);
};
</script>

<style scoped lang="less">
.table-drawer-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.layout-drawer {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--SmartThemeBorderColor);
}

.layout-main {
  flex: 1;
  overflow: hidden;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.3s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  width: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .table-drawer-layout {
    min-height: 400px;
  }

  .layout-drawer {
    width: 100%;
  }
}
</style>
