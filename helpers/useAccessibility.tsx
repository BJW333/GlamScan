import { useEffect, useRef, useState } from 'react';

/**
 * Accessibility utilities and hooks
 */

// Generate unique IDs for ARIA relationships
export const useId = (prefix: string = 'floot') => {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
};

// Manage ARIA expanded state
export const useAriaExpanded = (initialState: boolean = false) => {
  const [isExpanded, setIsExpanded] = useState(initialState);
  
  const toggle = () => setIsExpanded(prev => !prev);
  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return {
    isExpanded,
    'aria-expanded': isExpanded,
    toggle,
    expand,
    collapse,
  };
};

// Live region announcements
export const useLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { liveRegionRef, announce };
};

// Keyboard navigation helpers
export const useKeyboardNavigation = (
  items: HTMLElement[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onSelect?: (index: number) => void;
  } = {}
) => {
  const { loop = true, orientation = 'both', onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    let newIndex = activeIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = loop 
            ? (activeIndex + 1) % items.length 
            : Math.min(activeIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = loop 
            ? (activeIndex - 1 + items.length) % items.length 
            : Math.max(activeIndex - 1, 0);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = loop 
            ? (activeIndex + 1) % items.length 
            : Math.min(activeIndex + 1, items.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = loop 
            ? (activeIndex - 1 + items.length) % items.length 
            : Math.max(activeIndex - 1, 0);
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(activeIndex);
        return;
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      items[newIndex]?.focus();
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Color scheme detection
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};

// ARIA describedby helper
export const useAriaDescribedBy = (descriptions: string[]) => {
  const validDescriptions = descriptions.filter(Boolean);
  return validDescriptions.length > 0 ? validDescriptions.join(' ') : undefined;
};

// Form field accessibility
export const useFormField = (options: {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}) => {
  const { label, description, error, required } = options;
  const fieldId = useId('field');
  const labelId = useId('label');
  const descriptionId = useId('description');
  const errorId = useId('error');

  const describedBy = useAriaDescribedBy([
    description ? descriptionId : '',
    error ? errorId : '',
  ]);

  return {
    fieldProps: {
      id: fieldId,
      'aria-labelledby': label ? labelId : undefined,
      'aria-describedby': describedBy,
      'aria-required': required,
      'aria-invalid': !!error,
    },
    labelProps: {
      id: labelId,
      htmlFor: fieldId,
    },
    descriptionProps: {
      id: descriptionId,
    },
    errorProps: {
      id: errorId,
      role: 'alert',
    },
  };
};