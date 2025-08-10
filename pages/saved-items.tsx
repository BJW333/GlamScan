import React, { useState, useMemo } from "react";

import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { Package } from "lucide-react";
import { Frown } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { useSavedItems } from "../helpers/useSavedItems";
import { useThrottledToast } from "../helpers/useThrottledToast";
import { SavedItemType } from "../endpoints/saved-items/list_GET.schema";
import { SavedPostCard } from "../components/SavedPostCard";
import { SavedStyleComboCard } from "../components/SavedStyleComboCard";
import { SavedItemsSkeleton } from "../components/SavedItemsSkeleton";
import { Tabs, TabsList, TabsTrigger } from "../components/Tabs";
import { Button } from "../components/Button";

import styles from "./saved-items.module.css";

type FilterType = "all" | "post" | "style_combo";

function SavedItemsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const throttledToast = useThrottledToast();
  const {
    data,
    error,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSavedItems();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = useMemo(() => data?.pages.flatMap(page => page.savedItems) ?? [], [data]);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return allItems;
    }
    return allItems.filter(item => item.itemType === filter);
  }, [allItems, filter]);

  const renderContent = () => {
    if (isFetching && !data) {
      return <SavedItemsSkeleton />;
    }

    if (error) {
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
      
      return (
        <div className={styles.messageContainer}>
          <Frown className={styles.messageIcon} />
          <h2 className={styles.messageTitle}>Unable to Load Saved Items</h2>
          <p className={styles.messageText}>
            {isNetworkError 
              ? "Please check your internet connection and try again."
              : "We're having trouble loading your saved items right now. Please try again in a moment."
            }
          </p>
          <div className={styles.actions}>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (!allItems || allItems.length === 0) {
      return (
        <div className={styles.messageContainer}>
          <Heart className={styles.messageIcon} />
          <h2 className={styles.messageTitle}>Start Building Your Collection</h2>
          <p className={styles.messageText}>
            Save posts and style combinations you love to create your personal inspiration board. 
            Your saved items will appear here for easy access anytime.
          </p>
          <div className={styles.actionTips}>
            <h4>How to save items:</h4>
            <ul>
              <li>Browse the feed and click the heart icon on posts you like</li>
              <li>Explore style combinations and save your favorites</li>
              <li>Build your personal style collection</li>
            </ul>
          </div>
            <div className={styles.actions}>
              <Button asChild>
                <Link to="/hot-or-not">Browse Posts</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/style-combos">Explore Styles</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/dashboard">Try AI Scanner</Link>
              </Button>
            </div>
        </div>
      );
    }
    
    if (filteredItems.length === 0) {
        const filterText = filter === "post" ? "posts" : filter === "style_combo" ? "style combinations" : "items";
        
        return (
            <div className={styles.messageContainer}>
                <Package className={styles.messageIcon} />
                <h2 className={styles.messageTitle}>No {filterText.charAt(0).toUpperCase() + filterText.slice(1)} Saved</h2>
                <p className={styles.messageText}>
                    You haven't saved any {filterText} yet. Start exploring to build your collection!
                </p>
                <div className={styles.actions}>
                    <Button onClick={() => setFilter("all")} variant="outline">
                        View All Items
                    </Button>
                    <Button asChild>
                        <Link to={filter === "post" ? "/hot-or-not" : "/style-combos"}>
                            Find {filterText.charAt(0).toUpperCase() + filterText.slice(1)}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
      <div className={styles.grid}>
        {filteredItems.map((item) => {
          if (item.itemType === "post") {
            return <SavedPostCard key={`post-${item.id}`} item={item} />;
          }
          if (item.itemType === "style_combo") {
            return <SavedStyleComboCard key={`combo-${item.id}`} item={item} />;
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>My Saved Style Collection | GlamScan</title>
        <meta
          name="description"
          content="View your saved outfits, makeup looks, and style combinations. Access your personal collection of favorite fashion and beauty inspiration."
        />
        <meta name="keywords" content="saved items, fashion collection, style favorites, saved outfits, personal style board" />
        <link rel="canonical" href="/saved-items" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/saved-items" />
        <meta property="og:title" content="My Saved Style Collection | GlamScan" />
        <meta property="og:description" content="View your saved outfits, makeup looks, and style combinations. Access your personal collection of favorite fashion and beauty inspiration." />
        <meta property="og:site_name" content="GlamScan" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="My Saved Style Collection | GlamScan" />
        <meta property="twitter:description" content="View your saved outfits, makeup looks, and style combinations. Access your personal collection of favorite fashion and beauty inspiration." />
        
        {/* Additional SEO */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Saved Items</h1>
          <p className={styles.subtitle}>
            Your curated collection of styles and inspiration.
          </p>
        </header>

        <div className={styles.filters}>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="post">
                <ImageIcon size={16} /> Posts
              </TabsTrigger>
              <TabsTrigger value="style_combo">
                <Package size={16} /> Style Combos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <main className={styles.content}>
          {renderContent()}
          <div ref={ref} className={styles.loadMoreTrigger}>
            {isFetchingNextPage && <SavedItemsSkeleton count={4} />}
          </div>
        </main>
      </div>
    </>
  );
}

export default SavedItemsPage;