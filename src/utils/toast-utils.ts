type NativeToastType = 'success' | 'error' | 'warning' | 'info';

export class ToastUtil {
    static show(message: string, type: NativeToastType = 'info', title?: string): void {
        try {
            const toastr = (window as any).toastr;
            if (toastr && typeof toastr[type] === 'function') {
                toastr[type](message, title);
            } else {
                console.warn(`[ToastUtil] toastr not available, message: ${message}`);
            }
        } catch (error) {
            console.warn('[ToastUtil] Failed to show toast:', error);
        }
    }

    static success(message: string, title?: string): void {
        this.show(message, 'success', title);
    }

    static error(message: string, title?: string): void {
        this.show(message, 'error', title);
    }

    static warning(message: string, title?: string): void {
        this.show(message, 'warning', title);
    }

    static info(message: string, title?: string): void {
        this.show(message, 'info', title);
    }
}
