<template>
  <div class="table-drawer-layout">
    <div class="layout-header">
      <DrawerToggle :expanded="drawerExpanded" @toggle="handleDrawerToggle" />
    </div>
    <div class="layout-content">
      <Transition name="drawer-slide">
        <div v-if="drawerExpanded" class="layout-drawer">
          <TableListDrawer :tables="tables" :selected-table="selectedTable" @select="handleTableSelect" />
        </div>
      </Transition>
      <div class="layout-main">
        <slot></slot>
      </div>
    </div>
    <DrawerToggle :fab="true" :expanded="drawerExpanded" @toggle="handleDrawerToggle" />
  </div>
</template>

<script setup lang="ts">
import type {TableSchema} from '@/infra/sql';
import DrawerToggle from './DrawerToggle.vue';
import TableListDrawer from './TableListDrawer.vue';

interface Props {
  drawerExpanded: boolean;
  tables: TableSchema[];
  selectedTable?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:drawerExpanded': [value: boolean];
  selectTable: [tableName: string];
}>();

const handleDrawerToggle = () => {
  emit('update:drawerExpanded', !props.drawerExpanded);
};

const handleTableSelect = (tableName: string) => {
  emit('selectTable', tableName);
};
</script>

<style scoped lang="less">
.table-drawer-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}

.layout-header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  display: flex;
  align-items: center;
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

  .layout-header {
    display: none;
  }

  .layout-content {
    flex-direction: column;
  }

  .layout-drawer {
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    max-height: 60vh;
    border-right: none;
    border-top: 1px solid var(--SmartThemeBorderColor);
  }

  .layout-main {
    padding-bottom: 0;
  }
}
</style>
