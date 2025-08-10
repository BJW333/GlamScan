import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus management utilities for accessibility
 */

// Focus trap for modals and dialogs
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let parent components handle escape
        e.stopPropagation();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
      
      // Restore focus to the previously focused element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Focus management for roving tabindex (like in toolbars)
export const useRovingTabIndex = (items: HTMLElement[], activeIndex: number) => {
  useEffect(() => {
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.setAttribute('tabindex', '0');
        item.focus();
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });
  }, [items, activeIndex]);
};

// Skip link functionality
export const useSkipLink = () => {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const targetRef = useRef<HTMLElement>(null);

  const handleSkipLinkClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (targetRef.current) {
      targetRef.current.focus();
      targetRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    skipLinkRef,
    targetRef,
    handleSkipLinkClick,
  };
};

// Announce content changes to screen readers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus visible utility
export const useFocusVisible = () => {
  const ref = useRef<HTMLElement>(null);
  const isFocusVisibleRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let hadKeyboardEvent = false;

    const onKeyDown = () => {
      hadKeyboardEvent = true;
    };

    const onMouseDown = () => {
      hadKeyboardEvent = false;
    };

    const onFocus = () => {
      if (hadKeyboardEvent) {
        isFocusVisibleRef.current = true;
        element.setAttribute('data-focus-visible', '');
      }
    };

    const onBlur = () => {
      isFocusVisibleRef.current = false;
      element.removeAttribute('data-focus-visible');
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    element.addEventListener('focus', onFocus);
    element.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onBlur);
    };
  }, []);

  return { ref, isFocusVisible: isFocusVisibleRef.current };
};