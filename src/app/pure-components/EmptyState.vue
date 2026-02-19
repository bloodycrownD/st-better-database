<template>
  <div :class="variant" class="empty-state">
    <i :class="icon" :style="{ fontSize: `${iconSize}px` }"></i>
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string;
  text: string;
  iconSize?: number;
  variant?: 'default' | 'compact';
}

withDefaults(defineProps<Props>(), {
  iconSize: 48,
  variant: 'default'
});
</script>

<style scoped lang="less">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 30%, transparent);

  span {
    font-size: 14px;
  }

  &.compact {
    gap: 12px;
    padding: 40px 20px;

    span {
      font-size: 14px;
    }
  }
}
</style>
