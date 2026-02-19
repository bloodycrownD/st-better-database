<template>
  <div class="tab-container">
    <div class="tab-header">
      <div
          v-for="tab in visibleTabs"
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
import {computed, onMounted, onUnmounted, ref} from 'vue';

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

interface Props {
  tabs: TabItem[];
  activeTab: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:activeTab': [value: string];
}>();

const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const visibleTabs = computed(() => {
  const isMobile = windowWidth.value <= 768;
  return props.tabs.filter(tab => {
    if (tab.mobileOnly && !isMobile) return false;
    if (tab.desktopOnly && isMobile) return false;
    return true;
  });
});

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
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
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
  overflow: hidden;
}

@media (max-width: 768px) {
  .tab-header {
    .tab-item {
      width: 40vw;
      flex-shrink: 0;
      justify-content: center;
      padding: 14px 16px;
      font-size: 13px;
      white-space: nowrap;
    }
  }

  .tab-item {
    gap: 6px;
  }
}
</style>
