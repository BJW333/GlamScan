import React from "react";
import { Button } from "./Button";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { AiOutfitItemSchema } from "../endpoints/ai-outfit/generate_POST.schema";
import { OptimizedImage } from "./OptimizedImage";
import { z } from "zod";
import styles from "./AiOutfitCard.module.css";

interface AiOutfitCardProps {
  item: z.infer<typeof AiOutfitItemSchema>;
}

export const AiOutfitCard = React.memo(({ item }: AiOutfitCardProps) => {
  const handleBuyClick = () => {
    window.open(item.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <OptimizedImage
          src={item.imageUrl}
          alt={item.name}
          className={styles.image}
          aspectRatio="4/3"
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="skeleton"
          fallbackSrc="/placeholder-product.jpg"
        />
        <div className={styles.aiLabel}>
          AI Generated
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.category}>
          {item.category}
        </div>
        
        <h3 className={styles.name}>
          {item.name}
        </h3>
        
        <p className={styles.description}>
          {item.description}
        </p>
        
        <div className={styles.footer}>
          <div className={styles.price}>
            ${item.price.toFixed(2)}
          </div>
          
          <Button
            onClick={handleBuyClick}
            variant="primary"
            size="sm"
            className={styles.buyButton}
          >
            <ShoppingBag size={16} />
            Buy on Amazon
            <ExternalLink size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
});

AiOutfitCard.displayName = 'AiOutfitCard';