import { ReactNode } from 'react';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  children?: ReactNode;
  lines?: number; // For text variant
}

export const SkeletonLoader = ({
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  animation = 'pulse',
  className = '',
  children,
  lines = 1,
}: SkeletonLoaderProps) => {
  // If children are provided, show them instead of skeleton
  if (children) {
    return <>{children}</>;
  }

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const skeletonClasses = [
    styles.skeleton,
    styles[variant],
    styles[animation],
    className,
  ].filter(Boolean).join(' ');

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={styles.textContainer}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={skeletonClasses}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? '75%' : '100%', // Last line is shorter
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={skeletonClasses}
      style={skeletonStyle}
      aria-hidden="true"
      role="presentation"
    />
  );
};

// Preset skeleton components for common use cases
export const SkeletonText = ({ lines = 3, ...props }: Omit<SkeletonLoaderProps, 'variant'> & { lines?: number }) => (
  <SkeletonLoader variant="text" lines={lines} height="1rem" {...props} />
);

export const SkeletonAvatar = ({ size = 40, ...props }: Omit<SkeletonLoaderProps, 'variant' | 'width' | 'height'> & { size?: number }) => (
  <SkeletonLoader variant="circular" width={size} height={size} {...props} />
);

export const SkeletonButton = ({ ...props }: Omit<SkeletonLoaderProps, 'variant'>) => (
  <SkeletonLoader variant="rounded" width="120px" height="40px" {...props} />
);

export const SkeletonCard = ({ ...props }: Omit<SkeletonLoaderProps, 'variant'>) => (
  <SkeletonLoader variant="rounded" width="100%" height="200px" {...props} />
);

// Skeleton for product cards
export const SkeletonProductCard = () => (
  <div className={styles.productCard}>
    <SkeletonLoader variant="rounded" width="100%" height="200px" className={styles.productImage} />
    <div className={styles.productContent}>
      <SkeletonText lines={2} />
      <SkeletonLoader variant="text" width="60%" height="1.25rem" className={styles.productPrice} />
      <SkeletonButton />
    </div>
  </div>
);

// Skeleton for list items
export const SkeletonListItem = () => (
  <div className={styles.listItem}>
    <SkeletonAvatar size={48} />
    <div className={styles.listContent}>
      <SkeletonLoader variant="text" width="80%" height="1rem" />
      <SkeletonLoader variant="text" width="60%" height="0.875rem" />
    </div>
  </div>
);

// Skeleton for form fields
export const SkeletonFormField = () => (
  <div className={styles.formField}>
    <SkeletonLoader variant="text" width="120px" height="1rem" className={styles.formLabel} />
    <SkeletonLoader variant="rounded" width="100%" height="40px" />
  </div>
);