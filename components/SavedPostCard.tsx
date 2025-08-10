import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useToggleSaveItem } from '../helpers/useToggleSaveItem';
import { SavedPost } from '../endpoints/saved-items/list_GET.schema';
import { z } from 'zod';
import { Button } from './Button';
import { OptimizedImage } from './OptimizedImage';
import styles from './SavedPostCard.module.css';

interface SavedPostCardProps {
  item: z.infer<typeof SavedPost>;
  className?: string;
}

export const SavedPostCard = React.memo<SavedPostCardProps>(({ item, className }) => {
  const { mutate: toggleSave, isPending: isTogglingSave } = useToggleSaveItem();

  const handleUnsaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave({
      itemId: item.id,
      itemType: 'post',
    });
  };

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <Link to={`/post/${item.id}`} className={styles.link}>
        <div className={styles.imageContainer}>
          <OptimizedImage
            src={item.imageUrl}
            alt={item.caption || `Saved post ${item.id}`}
            className={styles.image}
            aspectRatio="1"
            sizes="(max-width: 768px) 50vw, 33vw"
            placeholder="skeleton"
            fallbackSrc="/placeholder-image.jpg"
          />
        </div>
        {item.caption && (
          <div className={styles.captionContainer}>
            <p className={styles.caption}>{item.caption}</p>
          </div>
        )}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className={styles.unsaveButton}
        onClick={handleUnsaveClick}
        disabled={isTogglingSave}
        aria-label="Unsave post"
      >
        <Heart className={styles.heartIcon} fill="var(--primary)" />
      </Button>
    </div>
  );
});

SavedPostCard.displayName = 'SavedPostCard';