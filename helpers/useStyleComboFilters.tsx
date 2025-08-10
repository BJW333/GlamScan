import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "./useDebounce";

export type StyleComboFilters = {
  search: string;
  season: string;
  occasion: string;
  style: string;
};

export const useStyleComboFilters = () => {
  const [filters, setFilters] = useState<StyleComboFilters>({
    search: "",
    season: "all",
    occasion: "all",
    style: "all",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const queryFilters = useMemo(() => {
    return {
      search: debouncedSearch || undefined,
      season: filters.season === "all" ? undefined : filters.season,
      occasion: filters.occasion === "all" ? undefined : filters.occasion,
      style: filters.style === "all" ? undefined : filters.style,
    };
  }, [debouncedSearch, filters.season, filters.occasion, filters.style]);

  const handleFilterChange = useCallback(
    (filterName: keyof StyleComboFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [filterName]: value }));
    },
    []
  );

  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.season !== "all" || filters.occasion !== "all" || filters.style !== "all";
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      season: "all",
      occasion: "all",
      style: "all",
    });
  }, []);

  return {
    filters,
    queryFilters,
    handleFilterChange,
    hasActiveFilters,
    clearFilters,
  };
};