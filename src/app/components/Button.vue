<template>
  <button class="menu_button button-wrapper" @click="$emit('click')">
    <span class="button-content"><slot></slot></span>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<style scoped lang="less">
.button-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-direction: row;
  white-space: nowrap;
}
</style>

