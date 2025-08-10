import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { z } from "zod";
import { AiOutfitItemSchema } from "../endpoints/ai-outfit/generate_POST.schema";
import { useStyleComboFilters, StyleComboFilters } from "./useStyleComboFilters";

type ViewMode = 'regular' | 'ai';

interface StyleComboContextValue {
  // Filter state
  filters: StyleComboFilters;
  queryFilters: {
    search?: string;
    season?: string;
    occasion?: string;
    style?: string;
  };
  handleFilterChange: (filterName: keyof StyleComboFilters, value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  
  // View mode state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // AI outfit state
  aiOutfitItems: z.infer<typeof AiOutfitItemSchema>[];
  setAiOutfitItems: (items: z.infer<typeof AiOutfitItemSchema>[]) => void;
  
  // UI state
  showAiForm: boolean;
  setShowAiForm: (show: boolean) => void;
}

const StyleComboContext = createContext<StyleComboContextValue | undefined>(undefined);

export const useStyleComboContext = () => {
  const context = useContext(StyleComboContext);
  if (!context) {
    throw new Error('useStyleComboContext must be used within a StyleComboProvider');
  }
  return context;
};

interface StyleComboProviderProps {
  children: ReactNode;
}

export const StyleComboProvider = ({ children }: StyleComboProviderProps) => {
  const filterState = useStyleComboFilters();
  const [viewMode, setViewMode] = useState<ViewMode>('regular');
  const [aiOutfitItems, setAiOutfitItems] = useState<z.infer<typeof AiOutfitItemSchema>[]>([]);
  const [showAiForm, setShowAiForm] = useState(false);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleAiOutfitGenerated = useCallback((outfit: z.infer<typeof AiOutfitItemSchema>[]) => {
    setAiOutfitItems(outfit);
    setViewMode('ai');
  }, []);

  const value: StyleComboContextValue = {
    ...filterState,
    hasActiveFilters: Boolean(filterState.hasActiveFilters),
    viewMode,
    setViewMode: handleViewModeChange,
    aiOutfitItems,
    setAiOutfitItems: handleAiOutfitGenerated,
    showAiForm,
    setShowAiForm,
  };

  return (
    <StyleComboContext.Provider value={value}>
      {children}
    </StyleComboContext.Provider>
  );
};