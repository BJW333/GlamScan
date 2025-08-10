import React, { ReactNode, cloneElement, isValidElement, ElementType } from 'react';
import styles from './VisuallyHidden.module.css';

interface VisuallyHiddenProps {
  children: ReactNode;
  asChild?: boolean;
  focusable?: boolean;
  className?: string;
}

/**
 * Visually hides content while keeping it accessible to screen readers
 */
export const VisuallyHidden = ({
  children,
  asChild = false,
  focusable = false,
  className = '',
}: VisuallyHiddenProps) => {
  const hiddenClasses = [
    styles.visuallyHidden,
    focusable ? styles.focusable : '',
    className,
  ].filter(Boolean).join(' ');

  if (asChild && isValidElement(children)) {
    // Clone the child element and add the visually hidden class
    const childProps = children.props as any;
    return cloneElement(children as React.ReactElement<any>, {
      ...childProps,
      className: `${childProps.className || ''} ${hiddenClasses}`.trim(),
    });
  }

  return (
    <span className={hiddenClasses}>
      {children}
    </span>
  );
};

// Screen reader only text component
interface ScreenReaderOnlyProps {
  children: ReactNode;
  tag?: ElementType;
  className?: string;
}

export const ScreenReaderOnly = ({
  children,
  tag: Tag = 'span',
  className = '',
}: ScreenReaderOnlyProps) => {
  return (
    <Tag className={`${styles.screenReaderOnly} ${className}`}>
      {children}
    </Tag>
  );
};

// Live region for dynamic announcements
interface LiveRegionProps {
  children?: ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export const LiveRegion = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className = '',
}: LiveRegionProps) => {
  return (
    <div
      className={`${styles.liveRegion} ${className}`}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {children}
    </div>
  );
};

// Accessible description component
interface AccessibleDescriptionProps {
  children: ReactNode;
  id: string;
  className?: string;
}

export const AccessibleDescription = ({
  children,
  id,
  className = '',
}: AccessibleDescriptionProps) => {
  return (
    <div
      id={id}
      className={`${styles.accessibleDescription} ${className}`}
      role="note"
    >
      {children}
    </div>
  );
};

// Error announcement component
interface ErrorAnnouncementProps {
  error?: string | null;
  id?: string;
  className?: string;
}

export const ErrorAnnouncement = ({
  error,
  id,
  className = '',
}: ErrorAnnouncementProps) => {
  if (!error) return null;

  return (
    <div
      id={id}
      className={`${styles.errorAnnouncement} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {error}
    </div>
  );
};

// Status announcement component
interface StatusAnnouncementProps {
  status?: string | null;
  id?: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export const StatusAnnouncement = ({
  status,
  id,
  priority = 'polite',
  className = '',
}: StatusAnnouncementProps) => {
  if (!status) return null;

  return (
    <div
      id={id}
      className={`${styles.statusAnnouncement} ${className}`}
      role="status"
      aria-live={priority}
    >
      {status}
    </div>
  );
};