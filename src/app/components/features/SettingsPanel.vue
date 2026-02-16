<template>
  <div class="category_container">
    <div class="card st-card-unified">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-[10px]">
          <i class="fa-solid fa-sliders mr-[6px]"></i>
          <span>启用插件</span>
        </div>
        <label class="st-toggle-switch">
          <input type="checkbox"/>
          <span class="st-toggle-slider"></span>
        </label>
      </div>
    </div>
    <div class="card st-card-unified">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-[10px]">
          <i class="fa-solid fa-file-lines mr-[6px]"></i>
          <span>日志开关</span>
        </div>
        <label class="st-toggle-switch">
          <input type="checkbox"/>
          <span class="st-toggle-slider"></span>
        </label>
      </div>
    </div>
    <div class="card st-card-unified">
      <div class="flex items-center justify-between flex-wrap gap-[10px]">
        <div class="flex items-center gap-[10px]">
          <i class="fa-solid fa-paper-plane mr-[6px]"></i>
          <span>对话推送</span>
        </div>
        <div class="flex items-center gap-[10px]">
          <label class="st-toggle-switch">
            <input type="checkbox"/>
            <span class="st-toggle-slider"></span>
          </label>
          <button class="menu_button whitespace-nowrap">
            <i class="fa-solid fa-pen-to-square mr-[6px]"></i>
            样式设置
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="category_container">
    <div class="card st-card-unified">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-[10px]">
          <i class="fa-solid fa-file-code mr-[6px]"></i>
          <span>数据库模版</span>
        </div>
        <button class="menu_button whitespace-nowrap">
          <i class="fa-solid fa-gear mr-[6px]"></i>
          模版管理
        </button>
      </div>
    </div>
  </div>

  <div class="category_container">
    <div class="card st-card-unified">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-[10px]">
          <i class="fa-solid fa-database mr-[6px]"></i>
          <span>全局数据库</span>
        </div>
        <button class="menu_button whitespace-nowrap">
          <i class="fa-solid fa-gear mr-[6px]"></i>
          数据管理
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@body-color: var(--SmartThemeBodyColor);
@em-color: var(--SmartThemeEmColor);
@blur-tint-color: var(--SmartThemeBlurTintColor);
@shadow-color: var(--SmartThemeShadowColor);
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
