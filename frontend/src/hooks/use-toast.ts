import { useState, useCallback } from "react";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

let toastCount = 0;

function genId() {
  return (++toastCount).toString();
}

function addToast(toast: ToastProps) {
  const id = genId();
  const newToast = { ...toast, id };
  toasts.push(newToast);

  listeners.forEach((listener) => listener(toasts));

  // Auto remove after duration
  const duration = toast.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

function dismissToast(toastId: string) {
  const index = toasts.findIndex((toast) => toast.id === toastId);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener(toasts));
  }
}

export function useToast() {
  const [toastList] = useState<Toast[]>([]);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const toast = useCallback((props: ToastProps) => {
    return addToast(props);
  }, []);

  const dismiss = useCallback((toastId: string) => {
    dismissToast(toastId);
  }, []);

  return {
    toast,
    dismiss,
    toasts: toastList,
    subscribe,
  };
}

// Simple notification function that can be used without the hook
export const toast = (props: ToastProps) => {
  // For now, we'll use a simple console.log or alert
  // In a real implementation, you'd want to integrate with a toast library
  if (props.variant === "destructive") {
    console.error(`${props.title}: ${props.description}`);
  } else {
    console.log(`${props.title}: ${props.description}`);
  }

  // You could also use browser notifications or a simple alert
  if (props.title) {
    // alert(`${props.title}${props.description ? ': ' + props.description : ''}`);
  }

  return addToast(props);
};
