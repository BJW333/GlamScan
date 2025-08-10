import React, { createContext, useState, useContext, useMemo, useCallback, ReactNode } from 'react';
import { z } from 'zod';
import { AiOutfitItemSchema } from '../endpoints/ai-outfit/generate_POST.schema';

type ViewMode = 'regular' | 'ai';

type StyleComboFilters = {
  season?: string;
  occasion?: string;
  style?: string;
};

type AiOutfitItem = z.infer<typeof AiOutfitItemSchema>;

interface StyleComboFilterContextType {
  filters: StyleComboFilters;
  setFilters: (filters: StyleComboFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  aiOutfitItems: AiOutfitItem[];
  setAiOutfitItems: (items: AiOutfitItem[]) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

const StyleComboFilterContext = createContext<StyleComboFilterContextType | undefined>(undefined);

export const StyleComboFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<StyleComboFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('regular');
  const [aiOutfitItems, setAiOutfitItems] = useState<AiOutfitItem[]>([]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || Object.values(filters).some(value => !!value);
  }, [searchQuery, filters]);

  const contextValue = useMemo(() => ({
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    aiOutfitItems,
    setAiOutfitItems,
    clearAllFilters,
    hasActiveFilters,
  }), [filters, searchQuery, viewMode, aiOutfitItems, clearAllFilters, hasActiveFilters]);

  return (
    <StyleComboFilterContext.Provider value={contextValue}>
      {children}
    </StyleComboFilterContext.Provider>
  );
};

export const useStyleComboFilter = (): StyleComboFilterContextType => {
  const context = useContext(StyleComboFilterContext);
  if (context === undefined) {
    throw new Error('useStyleComboFilter must be used within a StyleComboFilterProvider');
  }
  return context;
};