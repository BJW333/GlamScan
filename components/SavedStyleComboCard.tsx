import React from "react";
import type { SavedItemType } from "../endpoints/saved-items/list_GET.schema";
import { StyleComboCard } from "./StyleComboCard";

interface Props {
  item: Extract<SavedItemType, { itemType: "style_combo" }>;
}

export const SavedStyleComboCard = ({ item }: Props) => {
  return <StyleComboCard combo={item} variant="saved" />;
};