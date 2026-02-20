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
        <ToggleSwitch :checked="extensionSwitch" @change="extensionSwitch = $event"/>
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
          <ToggleSwitch :checked="chatStatusBarSwitch" @change="chatStatusBarSwitch = $event"/>
          <Button @click="handleCodeEditClick">
            <i class="fa-solid fa-pen-to-square" style="margin-right: 6px;"></i>
            前端代码
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

  <PopupModal
      v-model:visible="codeModalVisible"
      title="编辑前端代码"
      :closable="true"
      @close="handleCodeModalClose"
  >
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <textarea
          v-model="tempCode"
          rows="10"
          style="width: 100%; padding: 12px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; background: var(--black30a); color: var(--SmartThemeBodyColor); font-family: monospace; resize: vertical;"
          placeholder="请输入前端代码..."
      ></textarea>
    </div>
    <template #footer>
      <Button @click="handleCodeModalClose">取消</Button>
      <Button @click="handleCodeModalConfirm">确认</Button>
    </template>
  </PopupModal>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import CardItem from '@/app/components/pure-components/CardItem.vue';
import ToggleSwitch from '@/app/components/pure-components/ToggleSwitch.vue';
import Button from '@/app/components/pure-components/Button.vue';
import TemplateManagementPanel from '@/app/screens/business-screens/TemplateManagementPanel.vue';
import PopupModal from '@/app/components/pure-components/PopupModal.vue';
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

const chatStatusBarCode = computed({
  get: () => settings.chatStatusBarCode,
  set: (v: string) => settings.chatStatusBarCode = v
});

const codeModalVisible = ref(false);
const tempCode = ref('');

const handleCodeEditClick = () => {
  tempCode.value = chatStatusBarCode.value;
  codeModalVisible.value = true;
};

const handleCodeModalClose = () => {
  codeModalVisible.value = false;
};

const handleCodeModalConfirm = () => {
  chatStatusBarCode.value = tempCode.value;
  codeModalVisible.value = false;
};

const templateManagementPanelRef = ref<InstanceType<typeof TemplateManagementPanel>>();

const handleTemplateManagementClick = () => {
  templateManagementPanelRef.value?.open();
};
</script>
