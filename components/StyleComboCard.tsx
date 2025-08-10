import React from "react";
import type { StyleComboWithItems } from "../endpoints/style-combos/list_GET.schema";
import type { SavedItemType } from "../endpoints/saved-items/list_GET.schema";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { ShoppingBag, Tag, Heart } from "lucide-react";
import { useToggleSaveItem } from "../helpers/useToggleSaveItem";
import styles from "./StyleComboCard.module.css";

interface BaseStyleComboCardProps {
  className?: string;
}

interface RegularStyleComboCardProps extends BaseStyleComboCardProps {
  variant: "regular";
  combo: StyleComboWithItems;
}

interface SavedStyleComboCardProps extends BaseStyleComboCardProps {
  variant: "saved";
  combo: Extract<SavedItemType, { itemType: "style_combo" }>;
}

type StyleComboCardProps = RegularStyleComboCardProps | SavedStyleComboCardProps;

export const StyleComboCard = ({ combo, className, variant }: StyleComboCardProps) => {
  const toggleSaveMutation = useToggleSaveItem();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(combo.totalPrice));

  const handleUnsave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variant === "saved") {
      toggleSaveMutation.mutate({ itemId: combo.id, itemType: "style_combo" });
    }
  };

  const handleShopNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(combo.shopUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`${styles.card} ${variant === "saved" ? styles.savedCard : ""} ${className || ""}`}>
      <div className={styles.imageWrapper}>
        <img
          src={combo.coverImageUrl}
          alt={combo.title}
          className={styles.image}
          loading="lazy"
        />
        
        {variant === "regular" && combo.isSponsored && (
          <Badge variant="secondary" className={styles.sponsoredBadge}>
            Sponsored
          </Badge>
        )}
        
        {variant === "saved" && (
          <Button
            variant="destructive"
            size="icon"
            className={styles.unsaveButton}
            onClick={handleUnsave}
            disabled={toggleSaveMutation.isPending}
            aria-label="Unsave style combo"
          >
            <Heart size={18} fill="currentColor" />
          </Button>
        )}
        
        {variant === "regular" && (
          <div className={styles.itemThumbnails}>
            {combo.items.slice(0, 3).map((item) => (
              <img
                key={item.id}
                src={item.imageUrl}
                alt={item.name}
                className={styles.thumbnail}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        {variant === "regular" && (
          <div className={styles.tags}>
            {combo.season && <Badge variant="outline">{combo.season}</Badge>}
            {combo.occasion && <Badge variant="outline">{combo.occasion}</Badge>}
          </div>
        )}
        
        <h3 className={styles.title}>{combo.title}</h3>
        <p className={styles.description}>{combo.description}</p>
        
        <div className={styles.footer}>
          {variant === "regular" ? (
            <>
              <div className={styles.priceContainer}>
                <Tag className={styles.priceIcon} />
                <span className={styles.price}>{formattedPrice}</span>
              </div>
              <Button
                asChild
                size="sm"
                className={styles.shopButton}
                aria-label={`Shop the look for ${combo.title}`}
              >
                <a href={combo.shopUrl} target="_blank" rel="noopener noreferrer">
                  <ShoppingBag size={16} />
                  Shop Look
                </a>
              </Button>
            </>
          ) : (
            <>
              <span className={styles.itemType}>Style Combo</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShopNow}
              >
                <ShoppingBag size={16} />
                Shop Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const StyleComboCardSkeleton = () => {
  return (
    <div className={styles.card}>
      <Skeleton className={styles.imageSkeleton} />
      <div className={styles.content}>
        <div className={styles.tags}>
          <Skeleton style={{ width: "60px", height: "22px" }} />
          <Skeleton style={{ width: "70px", height: "22px" }} />
        </div>
        <Skeleton style={{ height: "1.5rem", width: "80%", marginBottom: 'var(--spacing-2)' }} />
        <Skeleton style={{ height: "1rem", width: "100%" }} />
        <Skeleton style={{ height: "1rem", width: "90%", marginTop: 'var(--spacing-1)' }} />
        <div className={styles.footer}>
          <Skeleton style={{ height: "1.25rem", width: "80px" }} />
          <Skeleton style={{ height: "2rem", width: "110px" }} />
        </div>
      </div>
    </div>
  );
};