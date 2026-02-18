<template>
  <Transition name="modal">
    <div v-if="visible" class="popup-modal-overlay" @click.self="handleMaskClick">
      <div class="popup-modal">
        <div v-if="title || closable" class="popup-modal-header">
          <div class="popup-modal-title">{{ title }}</div>
          <div v-if="closable" class="popup-modal-close" @click="handleClose">
            <i class="fa-solid fa-xmark"></i>
          </div>
        </div>
        <div class="popup-modal-body">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="popup-modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  title?: string;
  closable?: boolean;
  maskClosable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  maskClosable: true
});

const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => {
  emit('close');
};

const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose();
  }
};
</script>

<style scoped lang="less">
.popup-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.popup-modal {
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 8px;
  box-shadow: 0 4px 20px var(--SmartThemeShadowColor);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.popup-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.popup-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
}

.popup-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 50%, transparent);
  transition: all 0.2s;

  &:hover {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    color: var(--SmartThemeBodyColor);
  }

  i {
    font-size: 18px;
  }
}

.popup-modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.popup-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--SmartThemeBorderColor);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .popup-modal,
.modal-leave-active .popup-modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .popup-modal {
  transform: scale(0.9);
  opacity: 0;
}

.modal-leave-to .popup-modal {
  transform: scale(0.9);
  opacity: 0;
}

@media (max-width: 768px) {
  .popup-modal-overlay {
    padding: 10px;
  }

  .popup-modal {
    max-height: 100vh;
    border-radius: 8px 8px 0 0;
    margin-top: auto;
  }

  .popup-modal-header {
    padding: 12px 16px;
  }

  .popup-modal-title {
    font-size: 16px;
  }

  .popup-modal-body {
    padding: 16px;
  }

  .popup-modal-footer {
    padding: 12px 16px;
  }
}
</style>
