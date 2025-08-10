import React from "react";
import { Skeleton } from "./Skeleton";
import styles from "./HotOrNotFeedSkeleton.module.css";

export const HotOrNotFeedSkeleton = () => {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.header}>
        <Skeleton className={styles.avatar} />
        <Skeleton className={styles.name} />
      </div>
      <div className={styles.footer}>
        <div className={styles.captionGroup}>
          <Skeleton className={styles.captionLine1} />
          <Skeleton className={styles.captionLine2} />
        </div>
        <div className={styles.actions}>
          <Skeleton className={styles.actionButton} />
          <Skeleton className={styles.actionButton} />
        </div>
      </div>
    </div>
  );
};