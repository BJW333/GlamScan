import React from "react";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Search, Calendar, PartyPopper, Shirt } from "lucide-react";
import styles from "./StyleCombosFilterBar.module.css";
import type { StyleComboFilters } from "../helpers/useStyleComboFilters";

interface StyleCombosFilterBarProps {
  filters: StyleComboFilters;
  onFilterChange: (filterName: keyof StyleComboFilters, value: string) => void;
}

const seasons = [
  { value: "all", label: "All Seasons" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
  { value: "winter", label: "Winter" }
];

const occasions = [
  { value: "all", label: "All Occasions" },
  { value: "casual", label: "Casual" },
  { value: "work", label: "Work" },
  { value: "formal", label: "Formal" },
  { value: "party", label: "Party" },
  { value: "vacation", label: "Vacation" }
];

const styleTypes = [
  { value: "all", label: "All Styles" },
  { value: "chic", label: "Chic" },
  { value: "boho", label: "Boho" },
  { value: "streetwear", label: "Streetwear" },
  { value: "classic", label: "Classic" },
  { value: "minimalist", label: "Minimalist" }
];

export const StyleCombosFilterBar = React.memo(
  ({ filters, onFilterChange }: StyleCombosFilterBarProps) => {
    return (
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <Input
            type="search"
            placeholder="Search styles or brands..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.selectsWrapper}>
          <div className={styles.selectContainer}>
            <Calendar className={styles.selectIcon} />
            <Select
              value={filters.season}
              onValueChange={(value) => onFilterChange("season", value)}
            >
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Season">
                  {filters.season !== "all" ? (
                    <span className={styles.selectedValue}>
                      {seasons.find(s => s.value === filters.season)?.label || filters.season}
                    </span>
                  ) : (
                    "Season"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.value} value={season.value}>
                    <span className={styles.selectItemText}>{season.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.selectContainer}>
            <PartyPopper className={styles.selectIcon} />
            <Select
              value={filters.occasion}
              onValueChange={(value) => onFilterChange("occasion", value)}
            >
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Occasion">
                  {filters.occasion !== "all" ? (
                    <span className={styles.selectedValue}>
                      {occasions.find(o => o.value === filters.occasion)?.label || filters.occasion}
                    </span>
                  ) : (
                    "Occasion"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {occasions.map((occasion) => (
                  <SelectItem key={occasion.value} value={occasion.value}>
                    <span className={styles.selectItemText}>{occasion.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.selectContainer}>
            <Shirt className={styles.selectIcon} />
            <Select
              value={filters.style}
              onValueChange={(value) => onFilterChange("style", value)}
            >
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Style">
                  {filters.style !== "all" ? (
                    <span className={styles.selectedValue}>
                      {styleTypes.find(s => s.value === filters.style)?.label || filters.style}
                    </span>
                  ) : (
                    "Style"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {styleTypes.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <span className={styles.selectItemText}>{style.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }
);

StyleCombosFilterBar.displayName = "StyleCombosFilterBar";