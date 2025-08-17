import { useCallback } from "react";
import {
  notificationService,
  NotificationOptions,
} from "@/services/notificationService";

export const useNotification = () => {
  const success = useCallback((options: NotificationOptions) => {
    return notificationService.success(options);
  }, []);

  const error = useCallback((options: NotificationOptions) => {
    return notificationService.error(options);
  }, []);

  const warning = useCallback((options: NotificationOptions) => {
    return notificationService.warning(options);
  }, []);

  const info = useCallback((options: NotificationOptions) => {
    return notificationService.info(options);
  }, []);

  const dismiss = useCallback((id: string) => {
    notificationService.dismiss(id);
  }, []);

  const dismissAll = useCallback(() => {
    notificationService.dismissAll();
  }, []);

  return {
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };
};
