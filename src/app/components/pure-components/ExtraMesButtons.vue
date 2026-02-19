<script setup lang="ts">
import {onMounted, onUnmounted} from 'vue'

const emit = defineEmits(['click'])

function handleClick() {
  emit('click')
}

onMounted(() => {
  $(document).on('click', '.open_database_table', handleClick)
})

onUnmounted(() => {
  $(document).off('click', '.open_database_table', handleClick)
})
</script>

<template>
  <Teleport to=".extraMesButtons">
    <div class="mes_button open_database_table" title="查看数据库表格">
      <i class="fa-solid fa-table"></i>
    </div>
  </Teleport>
</template>
