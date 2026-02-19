<template>
  <label class="st-toggle-switch">
    <input type="checkbox" :checked="checked" @change="$emit('change', ($event.target as HTMLInputElement).checked)"/>
    <span class="st-toggle-slider"></span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  checked: boolean
}>()

defineEmits<{
  change: [value: boolean]
}>()
</script>

<style scoped lang="less">
@body-color: var(--SmartThemeBodyColor);
@em-color: var(--SmartThemeEmColor);
@blur-tint-color: var(--SmartThemeBlurTintColor);
@shadow-color: var(--SmartThemeShadowColor);
@animation-duration: var(--animation-duration, 125ms);

.st-toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  transform: scale(0.9);

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.st-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: @em-color;
  transition: @animation-duration;
  border-radius: 22px;

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: @body-color;
    transition: @animation-duration;
    border-radius: 50%;
    box-shadow: 0 2px 4px @shadow-color;
  }
}

input:checked + .st-toggle-slider {
  background-color: @body-color;

  &:before {
    transform: translateX(18px);
    background-color: @blur-tint-color;
  }
}
</style>
