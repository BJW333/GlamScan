import { ReactNode } from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'muted';
  className?: string;
  label?: string;
}

export const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className={styles.circle} />
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  backdrop?: boolean;
  size?: LoadingSpinnerProps['size'];
}

export const LoadingOverlay = ({
  isLoading,
  children,
  message = 'Loading...',
  backdrop = true,
  size = 'lg',
}: LoadingOverlayProps) => {
  return (
    <div className={styles.overlayContainer}>
      {children}
      {isLoading && (
        <div className={`${styles.overlay} ${backdrop ? styles.backdrop : ''}`}>
          <div className={styles.overlayContent}>
            <LoadingSpinner size={size} label={message} />
            {message && <p className={styles.overlayMessage}>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline loading state
interface InlineLoadingProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  size?: LoadingSpinnerProps['size'];
}

export const InlineLoading = ({
  isLoading,
  children,
  fallback,
  size = 'sm',
}: InlineLoadingProps) => {
  if (isLoading) {
    return (
      <div className={styles.inlineLoading}>
        {fallback || <LoadingSpinner size={size} />}
      </div>
    );
  }

  return <>{children}</>;
};

// Button loading state
interface LoadingButtonProps {
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  className = '',
  disabled,
  onClick,
  type = 'button',
}: LoadingButtonProps) => {
  return (
    <button
      type={type}
      className={`${styles.loadingButton} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-disabled={disabled || isLoading}
    >
      {isLoading && (
        <LoadingSpinner size="sm" className={styles.buttonSpinner} />
      )}
      <span className={isLoading ? styles.loadingText : ''}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
};