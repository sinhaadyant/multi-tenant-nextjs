import { toast } from "sonner";
import { store } from "@/store";
import { addNotification, removeNotification } from "@/store/slices/uiSlice";

export interface NotificationOptions {
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  success(options: NotificationOptions) {
    const id = this.generateId();
    const notification = {
      id,
      type: "success" as const,
      title: options.title || "Success",
      message: options.message,
      duration: options.duration || 5000,
    };

    // Add to Redux store
    store.dispatch(addNotification(notification));

    // Show toast
    toast.success(options.message, {
      id,
      duration: options.duration || 5000,
      action: options.action,
    });

    // Auto-remove from Redux store
    setTimeout(() => {
      store.dispatch(removeNotification(id));
    }, options.duration || 5000);

    return id;
  }

  error(options: NotificationOptions) {
    const id = this.generateId();
    const notification = {
      id,
      type: "error" as const,
      title: options.title || "Error",
      message: options.message,
      duration: options.duration || 8000,
    };

    // Add to Redux store
    store.dispatch(addNotification(notification));

    // Show toast
    toast.error(options.message, {
      id,
      duration: options.duration || 8000,
      action: options.action,
    });

    // Auto-remove from Redux store
    setTimeout(() => {
      store.dispatch(removeNotification(id));
    }, options.duration || 8000);

    return id;
  }

  warning(options: NotificationOptions) {
    const id = this.generateId();
    const notification = {
      id,
      type: "warning" as const,
      title: options.title || "Warning",
      message: options.message,
      duration: options.duration || 6000,
    };

    // Add to Redux store
    store.dispatch(addNotification(notification));

    // Show toast
    toast.warning(options.message, {
      id,
      duration: options.duration || 6000,
      action: options.action,
    });

    // Auto-remove from Redux store
    setTimeout(() => {
      store.dispatch(removeNotification(id));
    }, options.duration || 6000);

    return id;
  }

  info(options: NotificationOptions) {
    const id = this.generateId();
    const notification = {
      id,
      type: "info" as const,
      title: options.title || "Info",
      message: options.message,
      duration: options.duration || 4000,
    };

    // Add to Redux store
    store.dispatch(addNotification(notification));

    // Show toast
    toast.info(options.message, {
      id,
      duration: options.duration || 4000,
      action: options.action,
    });

    // Auto-remove from Redux store
    setTimeout(() => {
      store.dispatch(removeNotification(id));
    }, options.duration || 4000);

    return id;
  }

  dismiss(id: string) {
    store.dispatch(removeNotification(id));
    toast.dismiss(id);
  }

  dismissAll() {
    // Clear all notifications from Redux store
    store.dispatch(removeNotification(""));
    toast.dismiss();
  }
}

export const notificationService = new NotificationService();
