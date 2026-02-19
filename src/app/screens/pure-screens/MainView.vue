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
  </div>
</template>

<script setup lang="ts">
import SettingsPanel from '@/app/screens/pure-screens/SettingsPanel.vue'
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
