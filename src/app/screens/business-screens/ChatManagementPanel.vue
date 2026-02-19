<template>
  <div>
    <slot></slot>

    <PopupModal
        v-model:visible="popupVisible"
        title="聊天数据库"
        :closable="true"
        height="650px"
        @close="handleClose"
    >
      <template #titlePrefix>
        <DrawerToggle :expanded="drawerExpanded" @toggle="handleDrawerToggle"/>
      </template>
      <TableDrawerLayout
          v-model:drawer-expanded="drawerExpanded"
          :tables="tables"
          :selected-table="selectedTable"
          @select-table="handleTableSelect"
          @create-table="handleCreateTable"
      >
        <TabContainer v-model:active-tab="activeTab" :tabs="tabs">
          <template #data>
            <ChatDataManagementTab
                :data-service="dataManagementService"
                :tables="tables"
                :selected-table="selectedTable"
                @refresh="refreshTables"
            />
          </template>
          <template #template>
            <ChatManagementTab
                ref="chatTabRef"
                :table-service="tableManagementService"
                :tables="tables"
                :selected-table="selectedTable"
                @refresh="refreshTables"
                @update:selected-table="handleTableSelect"
            />
          </template>
          <template #sql>
            <SqlPanelTab :sql-executor-service="sqlExecutorService" @refresh="refreshTables"/>
          </template>
        </TabContainer>
      </TableDrawerLayout>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">
import {nextTick, ref, watch} from 'vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
import TableDrawerLayout from '@/app/layouts/TableDrawerLayout.vue';
import type {TabItem} from '@/app/components/pure-components/TabContainer.vue';
import TabContainer from '@/app/components/pure-components/TabContainer.vue';
import DrawerToggle from '@/app/components/pure-components/DrawerToggle.vue';
import ChatManagementTab from '@/app/components/business-components/ChatManagementTab.vue';
import ChatDataManagementTab from '@/app/components/business-components/ChatDataManagementTab.vue';
import SqlPanelTab from '@/app/components/business-components/SqlPanelTab.vue';
import {useChatServices} from '@/app/composables/screens-composables/useServices.ts';
import type {TableSchema} from '@/infra/sql';

interface Props {
  defaultTabOnTableSelect?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultTabOnTableSelect: 'data'
});

const {dataManagementService, tableManagementService, sqlExecutorService} = useChatServices();

const popupVisible = defineModel<boolean>('visible', {default: false});
const drawerExpanded = ref(false);
const activeTab = ref('data');
const selectedTable = ref<string>('');
const tables = ref<TableSchema[]>([]);
const chatTabRef = ref<InstanceType<typeof ChatManagementTab> | null>(null);

const tabs: TabItem[] = [
  {key: 'data', label: '数据管理', icon: 'fa-solid fa-database'},
  {key: 'template', label: '模版管理', icon: 'fa-solid fa-table'},
  {key: 'sql', label: 'SQL面板', icon: 'fa-solid fa-code'}
];

const refreshTables = () => {
  tables.value = tableManagementService.value.getTables();
};

const handleTableSelect = (tableName: string) => {
  selectedTable.value = tableName;
  activeTab.value = props.defaultTabOnTableSelect;
};

const handleDrawerToggle = () => {
  drawerExpanded.value = !drawerExpanded.value;
};

const handleCreateTable = async () => {
  activeTab.value = 'template';
  await nextTick();
  chatTabRef.value?.openCreateTableModal();
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
