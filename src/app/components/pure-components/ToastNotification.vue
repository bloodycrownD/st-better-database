<template>
  <Transition name="toast">
    <div v-if="visible" class="toast-notification" :class="type">
      <i :class="icon"></i>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ToastType } from '@/app/composables/components-composables/useToast.ts';

interface Props {
  visible: boolean;
  message: string;
  type: ToastType;
  icon: string;
}

defineProps<Props>();
</script>

<style scoped lang="less">
.toast-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &.success {
    background: #10b981;
    color: white;
  }

  &.error {
    background: #ef4444;
    color: white;
  }

  i {
    font-size: 16px;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 768px) {
  .toast-notification {
    left: 16px;
    right: 16px;
    transform: none;
    justify-content: center;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-20px);
  }
}
</style>
