import { useRef } from 'react';
import { toast } from 'sonner';

interface ThrottledToastOptions {
  throttleMs?: number;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

export const useThrottledToast = (options: ThrottledToastOptions = {}) => {
  const { throttleMs = 2000 } = options;
  const lastToastTime = useRef<{ [key: string]: number }>({});

  const showToast = (
    type: 'success' | 'error' | 'info',
    message: string,
    key?: string,
    description?: string,
    action?: ToastAction
  ) => {
    const toastKey = key || message;
    const now = Date.now();
    
    if (!lastToastTime.current[toastKey] || now - lastToastTime.current[toastKey] > throttleMs) {
      lastToastTime.current[toastKey] = now;
      
      const toastOptions: any = {};
      if (description) toastOptions.description = description;
      if (action) toastOptions.action = action;
      
      toast[type](message, toastOptions);
    }
  };

  const throttledToast = {
    success: (message: string, key?: string, description?: string, action?: ToastAction) => {
      showToast('success', message, key, description, action);
    },
    
    error: (message: string, key?: string, description?: string, action?: ToastAction) => {
      showToast('error', message, key, description, action);
    },
    
    info: (message: string, key?: string, description?: string, action?: ToastAction) => {
      showToast('info', message, key, description, action);
    }
  };

  return throttledToast;
};