import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { CommentThread } from './CommentThread';
import styles from './CommentModal.module.css';

interface CommentModalProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const CommentModal = ({ postId, isOpen, onClose, className }: CommentModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`${styles.overlay} ${className ?? ''}`} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
      >
        <div className={styles.header}>
          <h3 id="comment-modal-title">Comments</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close comments">
            <X />
          </Button>
        </div>
        <div className={styles.content}>
          <CommentThread postId={postId} />
        </div>
      </div>
    </div>
  );
};