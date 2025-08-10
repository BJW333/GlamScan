import React, { Suspense } from 'react';
import { Skeleton } from './Skeleton';
import { LazyLoadErrorBoundary } from './LazyLoadErrorBoundary';
import styles from './LazyMessagingInterface.module.css';

// Lazy load the MessagingInterface with webpack chunk naming
const MessagingInterface = React.lazy(() => 
  import(/* webpackChunkName: "messaging-interface" */ './MessagingInterface').then(module => ({
    default: module.MessagingInterface
  }))
);

interface LazyMessagingInterfaceProps {
  className?: string;
}

const MessagingInterfaceSkeleton = () => (
  <div className={styles.skeletonContainer}>
    <div className={styles.skeletonSidebar}>
      <div className={styles.skeletonSidebarHeader}>
        <Skeleton style={{ width: '120px', height: '1.5rem' }} />
      </div>
      <div className={styles.skeletonConversationList}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeletonConversationItem}>
            <Skeleton style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
            <div className={styles.skeletonConversationInfo}>
              <Skeleton style={{ width: '100px', height: '1.25rem', marginBottom: 'var(--spacing-1)' }} />
              <Skeleton style={{ width: '150px', height: '1rem' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className={styles.skeletonChatPanel}>
      <div className={styles.skeletonNoChatSelected}>
        <Skeleton style={{ width: '200px', height: '1.25rem' }} />
      </div>
    </div>
  </div>
);

export const LazyMessagingInterface = ({ className }: LazyMessagingInterfaceProps) => {
  return (
    <LazyLoadErrorBoundary componentName="Messaging Interface">
      <Suspense fallback={<MessagingInterfaceSkeleton />}>
        <MessagingInterface className={className} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};