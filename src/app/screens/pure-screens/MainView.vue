<template>
  <div class="translation_settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <b>数据库配置</b>
        </div>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div style="padding: 10px;">
          <SettingsPanel/>
        </div>
      </div>
    </div>
    <ExtraMesButtons @click="handleExtraMesButtonClick"/>
    <ChatManagementPanel v-model:visible="chatPanelVisible"/>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import SettingsPanel from '@/app/screens/pure-screens/SettingsPanel.vue';
import ExtraMesButtons from '@/app/components/pure-components/ExtraMesButtons.vue';
import ChatManagementPanel from '@/app/screens/business-screens/ChatManagementPanel.vue';

const chatPanelVisible = ref(false);

const handleExtraMesButtonClick = () => {
  chatPanelVisible.value = true;
};
</script>

<style scoped lang="less">
.translation_settings {
  width: 100%;
}

.inline-drawer {
  width: 100%;
}

.inline-drawer-toggle {
  cursor: pointer;
}

.inline-drawer-icon {
  transition: transform 0.2s;

  &.down {
    transform: rotate(0deg);
  }

  &.up {
    transform: rotate(180deg);
  }
}
</style>
