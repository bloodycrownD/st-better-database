<template>
  <div class="category_container">
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-sliders" style="margin-right: 6px;"></i>
          <span>启用插件</span>
        </div>
      </template>
      <template #right>
        <ToggleSwitch :checked="false"/>
      </template>
    </CardItem>
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-file-lines" style="margin-right: 6px;"></i>
          <span>日志开关</span>
        </div>
      </template>
      <template #right>
        <ToggleSwitch :checked="false"/>
      </template>
    </CardItem>
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-paper-plane" style="margin-right: 6px;"></i>
          <span>对话推送</span>
        </div>
      </template>
      <template #right>
        <div style="display: flex; align-items: center; gap: 10px;">
          <ToggleSwitch :checked="false"/>
          <Button>
            <i class="fa-solid fa-pen-to-square" style="margin-right: 6px;"></i>
            样式设置
          </Button>
        </div>
      </template>
    </CardItem>
  </div>

  <div class="category_container">
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-file-code" style="margin-right: 6px;"></i>
          <span>数据库模版</span>
        </div>
      </template>
      <template #right>
        <Button>
          <i class="fa-solid fa-gear" style="margin-right: 6px;"></i>
          模版管理
        </Button>
      </template>
    </CardItem>
  </div>

  <div class="category_container">
    <CardItem>
      <template #left>
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-database" style="margin-right: 6px;"></i>
          <span>全局数据库</span>
        </div>
      </template>
      <template #right>
        <Button>
          <i class="fa-solid fa-gear" style="margin-right: 6px;"></i>
          数据管理
        </Button>
      </template>
    </CardItem>
  </div>
</template>

<script setup lang="ts">
import CardItem from '../shared/CardItem.vue'
import ToggleSwitch from '../shared/ToggleSwitch.vue'
import Button from '../shared/Button.vue'
</script>
