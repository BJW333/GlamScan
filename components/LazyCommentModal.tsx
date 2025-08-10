import React, { Suspense } from 'react';
import { Skeleton } from './Skeleton';
import { LazyLoadErrorBoundary } from './LazyLoadErrorBoundary';
import styles from './LazyCommentModal.module.css';

// Lazy load the CommentModal with webpack chunk naming
const CommentModal = React.lazy(() => 
  import(/* webpackChunkName: "comment-modal" */ './CommentModal').then(module => ({
    default: module.CommentModal
  }))
);

interface LazyCommentModalProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const CommentModalSkeleton = () => (
  <div className={styles.skeletonOverlay}>
    <div className={styles.skeletonPanel}>
      <div className={styles.skeletonHeader}>
        <Skeleton style={{ width: '100px', height: '1.5rem' }} />
        <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius)' }} />
      </div>
      <div className={styles.skeletonContent}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonComment}>
            <Skeleton style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }} />
            <div className={styles.skeletonCommentContent}>
              <Skeleton style={{ width: '120px', height: '1rem', marginBottom: 'var(--spacing-1)' }} />
              <Skeleton style={{ width: '100%', height: '3rem' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const LazyCommentModal = ({ postId, isOpen, onClose, className }: LazyCommentModalProps) => {
  // Don't render anything if not open to avoid unnecessary lazy loading
  if (!isOpen) {
    return null;
  }

  return (
    <LazyLoadErrorBoundary componentName="Comment Modal">
      <Suspense fallback={<CommentModalSkeleton />}>
        <CommentModal 
          postId={postId} 
          isOpen={isOpen} 
          onClose={onClose} 
          className={className} 
        />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};