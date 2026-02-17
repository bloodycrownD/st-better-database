<template>
  <div class="card st-card-unified">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <slot name="left"></slot>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="less">
@animation-duration: var(--animation-duration, 125ms);

.st-card-unified {
  min-height: 48px;
  display: flex;
  align-items: center;
  transition: background-color @animation-duration;

  > div {
    width: 100%;
  }
}
</style>
