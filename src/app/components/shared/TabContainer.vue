<template>
  <div class="tab-container">
    <div class="tab-header">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="handleTabClick(tab.key)"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span>{{ tab.label }}</span>
      </div>
    </div>
    <div class="tab-body">
      <template v-for="tab in tabs" :key="tab.key">
        <slot v-if="activeTab === tab.key" :name="tab.key"></slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

interface Props {
  tabs: TabItem[];
  activeTab: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:activeTab': [value: string];
}>();

const handleTabClick = (key: string) => {
  emit('update:activeTab', key);
};
</script>

<style scoped lang="less">
.tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-header {
  display: flex;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
}

.tab-item {
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--SmartThemeEmColor);

  &:hover {
    color: var(--SmartThemeBodyColor);
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
  }

  &.active {
    color: var(--SmartThemeBodyColor);
    border-bottom-color: var(--SmartThemeBorderColor);
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
  }

  i {
    font-size: 14px;
  }
}

.tab-body {
  flex: 1;
  overflow: auto;
}

@media (max-width: 768px) {
  .tab-header {
    .tab-item {
      flex: 1;
      justify-content: center;
      padding: 14px 12px;
      font-size: 13px;
    }
  }

  .tab-item {
    flex-direction: column;
    gap: 4px;

    i {
      font-size: 16px;
    }
  }
}
</style>
