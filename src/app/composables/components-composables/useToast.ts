import { reactive } from 'vue';

export type ToastType = 'success' | 'error';

export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  icon: string;
}

export function useToast() {
  const toast = reactive<ToastState>({
    visible: false,
    message: '',
    type: 'success',
    icon: 'fa-solid fa-check-circle'
  });

  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  const showToast = (message: string, type: ToastType = 'success') => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toast.message = message;
    toast.type = type;
    toast.icon = type === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-circle-xmark';
    toast.visible = true;

    toastTimeout = setTimeout(() => {
      toast.visible = false;
    }, 3000);
  };

  return {
    toast,
    showToast
  };
}
