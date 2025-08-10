import React from "react";
import { Helmet } from "react-helmet";
import { WandSparkles, Grid, Sparkles } from "lucide-react";
import { StyleCombosFilterBar } from "../components/StyleCombosFilterBar";
import { StyleCombosGrid } from "../components/StyleCombosGrid";
import { AiOutfitForm } from "../components/AiOutfitForm";
import { Button } from "../components/Button";
import { StyleComboProvider, useStyleComboContext } from "../helpers/StyleComboContext";
import styles from "./style-combos.module.css";

const StyleCombosContent = () => {
  const {
    filters,
    queryFilters,
    handleFilterChange,
    hasActiveFilters,
    clearFilters,
    viewMode,
    setViewMode,
    aiOutfitItems,
    setAiOutfitItems,
    showAiForm,
    setShowAiForm,
  } = useStyleComboContext();

  const handleGenerateClick = () => {
    setShowAiForm(true);
  };

  const handleAiFormClose = () => {
    setShowAiForm(false);
  };

  return (
    <>
      <Helmet>
        <title>Curated Style Combinations | GlamScan</title>
        <meta
          name="description"
          content="Discover curated outfit combinations, style packs, and seasonal trends. Shop the latest looks from top brands and create your perfect wardrobe."
        />
        <meta name="keywords" content="style combinations, outfit ideas, curated looks, fashion bundles, seasonal trends, wardrobe styling" />
        <link rel="canonical" href="/style-combos" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/style-combos" />
        <meta property="og:title" content="Curated Style Combinations | GlamScan" />
        <meta property="og:description" content="Discover curated outfit combinations, style packs, and seasonal trends. Shop the latest looks from top brands and create your perfect wardrobe." />
        <meta property="og:site_name" content="GlamScan" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="Curated Style Combinations | GlamScan" />
        <meta property="twitter:description" content="Discover curated outfit combinations, style packs, and seasonal trends. Shop the latest looks from top brands and create your perfect wardrobe." />
        
        {/* Additional SEO */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>Style Combos</h1>
          <p className={styles.subtitle}>
            Discover curated looks for any occasion. Your next favorite outfit
            awaits.
          </p>
          <div className={styles.headerActions}>
            <Button
              onClick={handleGenerateClick}
              variant="secondary"
              size="lg"
              className={styles.generateButton}
            >
              <WandSparkles size={20} />
              Generate AI Outfit
            </Button>
          </div>
        </header>

        {showAiForm && (
          <AiOutfitForm
            onClose={handleAiFormClose}
            onGenerated={setAiOutfitItems}
          />
        )}

        {aiOutfitItems.length > 0 && (
          <div className={styles.viewModeToggle}>
            <Button
              onClick={() => setViewMode('regular')}
              variant={viewMode === 'regular' ? 'primary' : 'outline'}
              size="sm"
              className={styles.toggleButton}
            >
              <Grid size={16} />
              Curated Styles
            </Button>
            <Button
              onClick={() => setViewMode('ai')}
              variant={viewMode === 'ai' ? 'primary' : 'outline'}
              size="sm"
              className={styles.toggleButton}
            >
              <Sparkles size={16} />
              AI Generated ({aiOutfitItems.length} items)
            </Button>
          </div>
        )}

        <StyleCombosFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <main className={styles.content}>
          <StyleCombosGrid 
            filters={queryFilters} 
            viewMode={viewMode}
            aiOutfitItems={aiOutfitItems}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </main>
      </div>
    </>
  );
};

function StyleCombosPage() {
  return (
    <StyleComboProvider>
      <StyleCombosContent />
    </StyleComboProvider>
  );
}

export default StyleCombosPage;