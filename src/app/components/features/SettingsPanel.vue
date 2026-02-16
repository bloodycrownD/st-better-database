<template>
  <div class="category_container">
    <div class="card st-card-unified">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-sliders" style="margin-right: 6px;"></i>
          <span>启用插件</span>
        </div>
        <ToggleSwitch :checked="false"/>
      </div>
    </div>
    <div class="card st-card-unified">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-file-lines" style="margin-right: 6px;"></i>
          <span>日志开关</span>
        </div>
        <ToggleSwitch :checked="false"/>
      </div>
    </div>
    <div class="card st-card-unified">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-paper-plane" style="margin-right: 6px;"></i>
          <span>对话推送</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <ToggleSwitch :checked="false"/>
          <Button>
            <i class="fa-solid fa-pen-to-square" style="margin-right: 6px;"></i>
            样式设置
          </Button>
        </div>
      </div>
    </div>
  </div>

  <div class="category_container">
    <div class="card st-card-unified">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-file-code" style="margin-right: 6px;"></i>
          <span>数据库模版</span>
        </div>
        <Button>
          <i class="fa-solid fa-gear" style="margin-right: 6px;"></i>
          模版管理
        </Button>
      </div>
    </div>
  </div>

  <div class="category_container">
    <div class="card st-card-unified">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-database" style="margin-right: 6px;"></i>
          <span>全局数据库</span>
        </div>
        <Button>
          <i class="fa-solid fa-gear" style="margin-right: 6px;"></i>
          数据管理
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToggleSwitch from '../shared/ToggleSwitch.vue'
import Button from '../shared/Button.vue'
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
