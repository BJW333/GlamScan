import React, { Fragment } from "react";
import { useStyleCombos } from "../helpers/useStyleCombos";
import { StyleComboCard, StyleComboCardSkeleton } from "./StyleComboCard";
import { AiOutfitCard } from "./AiOutfitCard";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { Frown, Sparkles } from "lucide-react";
import { AiOutfitItemSchema } from "../endpoints/ai-outfit/generate_POST.schema";
import { z } from "zod";
import styles from "./StyleCombosGrid.module.css";

interface StyleCombosGridProps {
  filters: {
    search?: string;
    season?: string;
    occasion?: string;
    style?: string;
  };
  viewMode?: 'regular' | 'ai';
  aiOutfitItems?: z.infer<typeof AiOutfitItemSchema>[];
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export const StyleCombosGrid = React.memo(({ 
  filters, 
  viewMode = 'regular',
  aiOutfitItems = [],
  hasActiveFilters = false,
  onClearFilters
}: StyleCombosGridProps) => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useStyleCombos(filters, 12);

  // Show AI-generated outfit items
  if (viewMode === 'ai') {
    if (aiOutfitItems.length === 0) {
      return (
        <div className={styles.messageContainer}>
          <Sparkles className={styles.icon} />
          <h3 className={styles.messageTitle}>No AI Outfits Generated Yet</h3>
          <p className={styles.messageText}>
            Click "Generate AI Outfit" to create personalized outfit recommendations using artificial intelligence.
          </p>
        </div>
      );
    }

    return (
      <div className={styles.grid}>
        {aiOutfitItems.map((item, index) => (
          <AiOutfitCard key={`ai-${index}`} item={item} />
        ))}
      </div>
    );
  }

  // Show regular style combos
  if (isFetching && !isFetchingNextPage && !data?.pages.length) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, index) => (
          <StyleComboCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.messageContainer}>
        <Frown className={styles.icon} />
        <h3 className={styles.messageTitle}>Something went wrong</h3>
        <p className={styles.messageText}>
          We couldn't load the style combos. Please try again later.
        </p>
      </div>
    );
  }

  const allCombos = data?.pages.flatMap((page) => page.styleCombos) ?? [];



  if (allCombos.length === 0) {
    return (
      <div className={styles.messageContainer}>
        <Frown className={styles.icon} />
        <h3 className={styles.messageTitle}>
          {hasActiveFilters ? "No Results Found" : "No Style Combos Available"}
        </h3>
        <p className={styles.messageText}>
          {hasActiveFilters 
            ? "Try adjusting your search or filters to find what you're looking for. You can clear filters or try different keywords."
            : "We're working on adding amazing style combinations for you. Check back soon!"
          }
        </p>
        {hasActiveFilters && onClearFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className={styles.clearFiltersButton}
          >
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {allCombos.map((combo) => (
          <StyleComboCard key={combo.id} combo={combo} variant="regular" />
        ))}
      </div>
      <div className={styles.loadMoreContainer}>
        {hasNextPage && (
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
            size="lg"
            className={styles.loadMoreButton}
          >
            {isFetchingNextPage ? (
              <>
                <Spinner size="sm" /> Loading More...
              </>
            ) : (
              "Load More Styles"
            )}
          </Button>
        )}
      </div>
    </>
  );
});

StyleCombosGrid.displayName = 'StyleCombosGrid';