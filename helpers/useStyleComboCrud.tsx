import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postStyleCombosCreate,
  InputType as CreateInputType,
} from "../endpoints/style-combos/create_POST.schema";
import {
  postStyleCombosUpdate,
  InputType as UpdateInputType,
} from "../endpoints/style-combos/update_POST.schema";
import {
  postStyleCombosDelete,
} from "../endpoints/style-combos/delete_POST.schema";
import {
  postStyleCombosDetail,
  StyleComboWithItems,
} from "../endpoints/style-combos/detail_POST.schema";
import { STYLE_COMBOS_QUERY_KEYS } from "./useStyleCombos";

// Standardized query key constants
export const STYLE_COMBO_DETAIL_QUERY_KEYS = {
  all: ["styleComboDetail"] as const,
  detail: (comboId: number) => [...STYLE_COMBO_DETAIL_QUERY_KEYS.all, comboId] as const,
} as const;

// Standardized stale times
const STALE_TIME_DETAIL = 5 * 60 * 1000; // 5 minutes for detail queries

// Request timeout
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Standardized error handler
const handleQueryError = (error: Error, context: string) => {
  console.error(`${context} error:`, error);
};

/**
 * Hook to fetch the details of a single style combo.
 * @param comboId The ID of the style combo to fetch. The query is disabled if the ID is null or undefined.
 */
export const useStyleComboDetail = (comboId: number | null | undefined) => {
  return useQuery<StyleComboWithItems, Error>({
    queryKey: STYLE_COMBO_DETAIL_QUERY_KEYS.detail(comboId!),
    queryFn: async () => {
      if (!comboId) {
        throw new Error("Style combo ID is required.");
      }
      const result = await postStyleCombosDetail({ id: comboId }, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
      });
      return result.styleCombo;
    },
    enabled: !!comboId,
    staleTime: STALE_TIME_DETAIL,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    placeholderData: (previousData) => previousData,
    meta: {
      onError: (error: Error) => handleQueryError(error, "Style combo detail"),
    },
  });
};

/**
 * Hook for creating a new style combo.
 * Invalidates the style combo list query on success.
 */
export const useCreateStyleCombo = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, CreateInputType>({
    mutationFn: (data: CreateInputType) => postStyleCombosCreate(data, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: () => {
      toast.success("Style Combo created successfully!");
      return queryClient.invalidateQueries({ queryKey: STYLE_COMBOS_QUERY_KEYS.all });
    },
    onError: (error) => {
      handleQueryError(error, "Create style combo");
      toast.error(error.message || "Failed to create style combo.");
    },
  });
};

/**
 * Hook for updating an existing style combo.
 * Invalidates both the style combo list and the specific detail query on success.
 */
export const useUpdateStyleCombo = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateInputType>({
    mutationFn: (data: UpdateInputType) => postStyleCombosUpdate(data, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: (data, variables) => {
      toast.success("Style Combo updated successfully!");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: STYLE_COMBOS_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: STYLE_COMBO_DETAIL_QUERY_KEYS.detail(variables.id) }),
      ]);
    },
    onError: (error) => {
      handleQueryError(error, "Update style combo");
      toast.error(error.message || "Failed to update style combo.");
    },
  });
};

/**
 * Hook for deleting a style combo.
 * Invalidates the style combo list query and removes the detail query from cache on success.
 */
export const useDeleteStyleCombo = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: number }>({
    mutationFn: (data: { id: number }) => postStyleCombosDelete(data, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: (data, variables) => {
      toast.success("Style Combo deleted successfully!");
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: STYLE_COMBOS_QUERY_KEYS.all });
      // Remove the deleted item's detail from cache
      queryClient.removeQueries({ queryKey: STYLE_COMBO_DETAIL_QUERY_KEYS.detail(variables.id) });
    },
    onError: (error) => {
      handleQueryError(error, "Delete style combo");
      toast.error(error.message || "Failed to delete style combo.");
    },
  });
};