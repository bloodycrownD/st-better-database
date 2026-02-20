<template>
  <div class="category_container">
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-sliders" style="margin-right: 6px;"></i>
          <span>启用插件</span>
        </div>
      </template>
      <template #right>
        <ToggleSwitch :checked="extensionSwitch" @update:checked="extensionSwitch = $event"/>
      </template>
    </CardItem>
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-paper-plane" style="margin-right: 6px;"></i>
          <span>对话状态栏</span>
        </div>
      </template>
      <template #right>
        <div style="display: flex; align-items: center; gap: 10px;">
          <ToggleSwitch :checked="chatStatusBarSwitch" @update:checked="chatStatusBarSwitch = $event"/>
          <Button>
            <i class="fa-solid fa-pen-to-square" style="margin-right: 6px;"></i>
            样式设置
          </Button>
        </div>
      </template>
    </CardItem>
  </div>

  <div class="category_container">
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-file-code" style="margin-right: 6px;"></i>
          <span>数据库模版</span>
        </div>
      </template>
      <template #right>
        <Button @click="handleTemplateManagementClick">
          <i class="fa-solid fa-gear" style="margin-right: 6px;"></i>
          模版管理
        </Button>
      </template>
    </CardItem>
  </div>

  <div class="category_container">
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-database" style="margin-right: 6px;"></i>
          <span>全局数据库</span>
        </div>
      </template>
      <template #right>
        <Button>
          <i class="fa-solid fa-gear" style="margin-right: 6px;"></i>
          数据管理
        </Button>
      </template>
    </CardItem>
  </div>

  <TemplateManagementPanel ref="templateManagementPanelRef">
    <template #default></template>
  </TemplateManagementPanel>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import CardItem from '@/app/components/pure-components/CardItem.vue';
import ToggleSwitch from '@/app/components/pure-components/ToggleSwitch.vue';
import Button from '@/app/components/pure-components/Button.vue';
import TemplateManagementPanel from '@/app/screens/business-screens/TemplateManagementPanel.vue';
import {ExtensionSettingManager} from '@/infra/sillytarvern/extension-setting-manager';

const settings = ExtensionSettingManager.instance;

const extensionSwitch = computed({
  get: () => settings.extensionSwitch,
  set: (v: boolean) => settings.extensionSwitch = v
});

const chatStatusBarSwitch = computed({
  get: () => settings.chatStatusBarSwitch,
  set: (v: boolean) => settings.chatStatusBarSwitch = v
});

const templateManagementPanelRef = ref<InstanceType<typeof TemplateManagementPanel>>();

const handleTemplateManagementClick = () => {
  templateManagementPanelRef.value?.open();
};
</script>
