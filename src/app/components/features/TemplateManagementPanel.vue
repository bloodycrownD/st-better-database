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
        @create-table="handleCreateTable"
      >
        <TabContainer v-model:active-tab="activeTab" :tabs="tabs">
          <template #template>
            <TemplateManagementTab
              ref="templateTabRef"
              :table-service="tableManagementService"
              :tables="tables"
              :selected-table="selectedTable"
              @refresh="refreshTables"
              @update:selected-table="handleTableSelect"
            />
          </template>
          <template #sql>
            <SqlPanelTab :sql-executor-service="sqlExecutorService" @refresh="refreshTables" />
          </template>
        </TabContainer>
      </TableDrawerLayout>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
 import {ref, watch, nextTick} from 'vue';
 import PopupModal from '../shared/PopupModal.vue';
 import TableDrawerLayout from '../shared/TableDrawerLayout.vue';
 import TabContainer from '../shared/TabContainer.vue';
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
const templateTabRef = ref<InstanceType<typeof TemplateManagementTab> | null>(null);

const tabs: TabItem[] = [
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

const handleCreateTable = async () => {
  console.log('[TemplateManagementPanel] handleCreateTable START');
  console.log('[TemplateManagementPanel] Current activeTab:', activeTab.value);
  // 切换到模板管理标签页
  activeTab.value = 'template';
  console.log('[TemplateManagementPanel] Switched to template tab:', activeTab.value);
  // 等待DOM更新后再打开模态框
  await nextTick();
  console.log('[TemplateManagementPanel] After nextTick, templateTabRef:', templateTabRef.value);
  templateTabRef.value?.openCreateTableModal();
  console.log('[TemplateManagementPanel] openCreateTableModal called, showCreateTableModal:', templateTabRef.value);
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
