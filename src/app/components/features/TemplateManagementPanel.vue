<template>
  <div>
    <slot></slot>

    <PopupModal
      v-model:visible="popupVisible"
      title="模版管理"
      :closable="true"
      @close="handleClose"
    >
      <template #titlePrefix>
        <DrawerToggle :expanded="drawerExpanded" @toggle="handleDrawerToggle" />
      </template>
      <TableDrawerLayout
        v-model:drawer-expanded="drawerExpanded"
        :tables="tables"
        :selected-table="selectedTable"
        @select-table="handleTableSelect"
      >
        <TabContainer v-model:active-tab="activeTab" :tabs="tabs">
          <template #tables>
            <TableListDrawer :tables="tables" :selected-table="selectedTable" @select="handleTableSelect" />
          </template>
          <template #template>
            <TemplateManagementTab
              :table-service="tableManagementService"
              :selected-table="selectedTable"
              @refresh="refreshTables"
            />
          </template>
          <template #sql>
            <SqlPanelTab :sql-executor-service="sqlExecutorService" />
          </template>
        </TabContainer>
      </TableDrawerLayout>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import PopupModal from '../shared/PopupModal.vue';
import TableDrawerLayout from '../shared/TableDrawerLayout.vue';
import TabContainer from '../shared/TabContainer.vue';
import TableListDrawer from '../shared/TableListDrawer.vue';
import DrawerToggle from '../shared/DrawerToggle.vue';
import TemplateManagementTab from './TemplateManagementTab.vue';
import SqlPanelTab from './SqlPanelTab.vue';
import type {TabItem} from '../shared/TabContainer.vue';
import {useTemplateServices} from '../../composables/useServices';
import type {TableSchema} from '@/infra/sql';

const {tableManagementService, sqlExecutorService} = useTemplateServices();

const popupVisible = defineModel<boolean>('visible', {default: false});
const drawerExpanded = ref(false);
const activeTab = ref('template');
const selectedTable = ref<string>('');
const tables = ref<TableSchema[]>([]);

const tabs: TabItem[] = [
  {key: 'tables', label: '表格列表', icon: 'fa-solid fa-list', mobileOnly: true},
  {key: 'template', label: '模版管理', icon: 'fa-solid fa-table'},
  {key: 'sql', label: 'SQL面板', icon: 'fa-solid fa-code'}
];

const refreshTables = () => {
  tables.value = tableManagementService.value.getTables();
};

const handleTableSelect = (tableName: string) => {
  selectedTable.value = tableName;
};

const handleDrawerToggle = () => {
  drawerExpanded.value = !drawerExpanded.value;
};

const handleClose = () => {
  popupVisible.value = false;
};

watch(popupVisible, (visible) => {
  if (visible) {
    refreshTables();
  }
});

defineExpose({
  open: () => {
    popupVisible.value = true;
  }
});
</script>
