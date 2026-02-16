<template>
  <button class="menu_button" @click="$emit('click')">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>
