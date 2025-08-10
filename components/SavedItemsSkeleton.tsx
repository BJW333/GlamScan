import React from "react";
import { Skeleton } from "./Skeleton";
import styles from "./SavedItemsSkeleton.module.css";

interface Props {
  count?: number;
}

export const SavedItemsSkeleton = ({ count = 8 }: Props) => {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <Skeleton className={styles.skeletonImage} />
          <div className={styles.skeletonContent}>
            <Skeleton style={{ height: '1.25rem', width: '80%', marginBottom: 'var(--spacing-2)' }} />
            <Skeleton style={{ height: '1rem', width: '100%' }} />
            <Skeleton style={{ height: '1rem', width: '60%', marginTop: 'var(--spacing-1)' }} />
            <div className={styles.skeletonFooter}>
              <Skeleton style={{ height: '0.8rem', width: '30%' }} />
              <Skeleton style={{ height: '2rem', width: '40%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};