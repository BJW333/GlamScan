import React, { Suspense } from 'react';
import { Skeleton } from './Skeleton';
import { LazyLoadErrorBoundary } from './LazyLoadErrorBoundary';
import styles from './LazyStyleComboManager.module.css';

// Lazy load the StyleComboManager with webpack chunk naming
const StyleComboManager = React.lazy(() => 
  import(/* webpackChunkName: "style-combo-manager" */ './StyleComboManager').then(module => ({
    default: module.StyleComboManager
  }))
);

interface LazyStyleComboManagerProps {
  comboId?: number;
  onSuccess: () => void;
  className?: string;
}

const StyleComboManagerSkeleton = ({ isEditMode }: { isEditMode: boolean }) => (
  <div className={styles.skeletonWrapper}>
    <div className={styles.skeletonHeader}>
      <Skeleton style={{ width: isEditMode ? '180px' : '200px', height: '2rem' }} />
    </div>
    
    <div className={styles.skeletonForm}>
      {/* Title field */}
      <div className={styles.skeletonField}>
        <Skeleton style={{ width: '60px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '100%', height: '2.5rem' }} />
      </div>
      
      {/* Description field */}
      <div className={styles.skeletonField}>
        <Skeleton style={{ width: '80px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ width: '100%', height: '6rem' }} />
      </div>
      
      {/* Season and other fields */}
      <div className={styles.skeletonFieldRow}>
        <div className={styles.skeletonField}>
          <Skeleton style={{ width: '50px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
        <div className={styles.skeletonField}>
          <Skeleton style={{ width: '70px', height: '1rem', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
      </div>
      
      {/* Items section */}
      <div className={styles.skeletonItemsSection}>
        <Skeleton style={{ width: '100px', height: '1.5rem', marginBottom: 'var(--spacing-3)' }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonItem}>
            <Skeleton style={{ width: '80px', height: '80px', borderRadius: 'var(--radius)' }} />
            <div className={styles.skeletonItemInfo}>
              <Skeleton style={{ width: '120px', height: '1.25rem', marginBottom: 'var(--spacing-1)' }} />
              <Skeleton style={{ width: '80px', height: '1rem', marginBottom: 'var(--spacing-1)' }} />
              <Skeleton style={{ width: '60px', height: '1rem' }} />
            </div>
            <Skeleton style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius)' }} />
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className={styles.skeletonActions}>
        <Skeleton style={{ width: '80px', height: '2.5rem' }} />
        <Skeleton style={{ width: '100px', height: '2.5rem' }} />
      </div>
    </div>
  </div>
);

export const LazyStyleComboManager = ({ comboId, onSuccess, className }: LazyStyleComboManagerProps) => {
  const isEditMode = !!comboId;

  return (
    <LazyLoadErrorBoundary componentName="Style Combo Manager">
      <Suspense fallback={<StyleComboManagerSkeleton isEditMode={isEditMode} />}>
        <StyleComboManager 
          comboId={comboId} 
          onSuccess={onSuccess} 
          className={className} 
        />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};