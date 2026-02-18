<template>
  <button :class="['drawer-toggle', { fab }]" @click="handleClick">
    <div class="hamburger-icon">
      <span class="line"></span>
      <span class="line"></span>
      <span class="line"></span>
    </div>
  </button>
</template>

<script setup lang="ts">
interface Props {
  expanded: boolean;
  fab?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fab: false
});

const emit = defineEmits<{
  toggle: [];
}>();

const handleClick = () => {
  emit('toggle');
};
</script>

<style scoped lang="less">
.drawer-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--SmartThemeBodyColor);
  transition: all 0.2s;
  border-radius: 4px;

  &:hover {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
  }

  &:active {
    transform: scale(0.95);
  }

  &.fab {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--SmartThemeBlurTintColor);
    border: 1px solid var(--SmartThemeBorderColor);
    box-shadow: 0 4px 12px var(--SmartThemeShadowColor);
    z-index: 1001;

    &:hover {
      background: color-mix(in srgb, var(--SmartThemeBorderColor) 50%, transparent);
    }

    .hamburger-icon {
      width: 24px;
      height: 24px;
    }

    @media (min-width: 769px) {
      display: none;
    }
  }

  @media (max-width: 768px) {
    &:not(.fab) {
      display: none;
    }
  }
}

.hamburger-icon {
  width: 24px;
  height: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.line {
  width: 100%;
  height: 2px;
  background: var(--SmartThemeBodyColor);
  border-radius: 2px;
  transition: all 0.3s ease;
}
</style>
