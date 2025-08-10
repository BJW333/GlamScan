import React, { ReactNode, cloneElement, isValidElement, forwardRef } from 'react';
import { useFocusVisible } from '../helpers/focusManagement';
import styles from './FocusRing.module.css';

interface FocusRingProps {
  children: ReactNode;
  className?: string;
  offset?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'error' | 'warning' | 'success';
  style?: 'solid' | 'dashed' | 'dotted';
  width?: number;
}

export const FocusRing = ({
  children,
  className = '',
  offset = 2,
  color = 'accent',
  style = 'solid',
  width = 2,
}: FocusRingProps) => {
  const { ref, isFocusVisible } = useFocusVisible();

  // Clone the child element to add the ref and focus ring styles
  if (isValidElement(children)) {
    const childProps = children.props as any;
    return cloneElement(children as React.ReactElement<any>, {
      ref,
      className: `${childProps.className || ''} ${styles.focusTarget} ${className}`,
      style: {
        ...childProps.style,
        '--focus-ring-offset': `${offset}px`,
        '--focus-ring-width': `${width}px`,
        '--focus-ring-color': `var(--${color})`,
        '--focus-ring-style': style,
      } as React.CSSProperties,
    });
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${styles.focusTarget} ${className}`}
      style={{
        '--focus-ring-offset': `${offset}px`,
        '--focus-ring-width': `${width}px`,
        '--focus-ring-color': `var(--${color})`,
        '--focus-ring-style': style,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// Skip link component for accessibility
interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const SkipLink = ({
  href,
  children,
  className = '',
}: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={`${styles.skipLink} ${className}`}
      onFocus={(e) => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      {children}
    </a>
  );
};

// Focus trap component
interface FocusTrapProps {
  children: ReactNode;
  isActive: boolean;
  className?: string;
  restoreFocus?: boolean;
}

export const FocusTrap = ({
  children,
  isActive,
  className = '',
  restoreFocus = true,
}: FocusTrapProps) => {
  // This would use the useFocusTrap hook from focusManagement helper
  // For now, we'll create a simple implementation
  return (
    <div
      className={`${styles.focusTrap} ${className}`}
      data-focus-trap={isActive}
    >
      {children}
    </div>
  );
};

// Roving tabindex for keyboard navigation in lists/grids
interface RovingTabIndexProps {
  children: ReactNode[];
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  className?: string;
}

export const RovingTabIndex = ({
  children,
  orientation = 'both',
  loop = true,
  className = '',
}: RovingTabIndexProps) => {
  return (
    <div
      className={`${styles.rovingTabIndex} ${className}`}
      role="group"
      data-orientation={orientation}
      data-loop={loop}
    >
      {children.map((child, index) => (
        <div
          key={index}
          className={styles.rovingItem}
          tabIndex={index === 0 ? 0 : -1}
        >
          {child}
        </div>
      ))}
    </div>
  );
};