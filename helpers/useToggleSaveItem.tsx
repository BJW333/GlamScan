import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postToggleSavedItem, InputType } from "../endpoints/saved-items/toggle_POST.schema";
import { useThrottledToast } from "./useThrottledToast";
import { SAVED_ITEMS_QUERY_KEYS } from "./useSavedItems";
import type { InfiniteData } from "@tanstack/react-query";
import type { OutputType as SavedItemsListOutput } from "../endpoints/saved-items/list_GET.schema";

export const useToggleSaveItem = () => {
  const queryClient = useQueryClient();
  const throttledToast = useThrottledToast();

  return useMutation({
    mutationFn: (variables: InputType) => postToggleSavedItem(variables),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: SAVED_ITEMS_QUERY_KEYS.all });

      // Snapshot the previous value for rollback
      const previousSavedItems = queryClient.getQueriesData({ 
        queryKey: SAVED_ITEMS_QUERY_KEYS.all 
      });

      // Optimistically update the saved items cache
      queryClient.setQueriesData(
        { queryKey: SAVED_ITEMS_QUERY_KEYS.all },
        (oldData: InfiniteData<SavedItemsListOutput> | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              savedItems: page.savedItems.filter(item => 
                !(item.id === variables.itemId && item.itemType === variables.itemType)
              ),
              totalCount: Math.max(0, page.totalCount - 1)
            }))
          };
        }
      );

      // Return context for rollback
      return { previousSavedItems };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousSavedItems) {
        context.previousSavedItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      console.error("Failed to toggle save item:", error);
      throttledToast.error(
        'Failed to save item',
        'toggle-save-error',
        'Please try again or check your connection'
      );
    },
    onSuccess: (data, variables) => {
      // Update the cache with the actual server response
      queryClient.setQueriesData(
        { queryKey: SAVED_ITEMS_QUERY_KEYS.all },
        (oldData: InfiniteData<SavedItemsListOutput> | undefined) => {
          if (!oldData) return oldData;

          // If item was saved, we don't need to add it to the list since this is for saved items
          // If item was unsaved, it should already be removed by the optimistic update
          return oldData;
        }
      );

      // Invalidate related queries to ensure consistency across the app
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      
      if (variables.itemType === "style_combo") {
        queryClient.invalidateQueries({ queryKey: ["style-combos"] });
      }
      
      // Show success feedback
      const action = data.saved ? 'saved' : 'removed from saved items';
      throttledToast.success(
        `Item ${action}!`,
        'toggle-save',
        undefined,
        {
          label: 'View Saved',
          onClick: () => {
            window.location.href = '/saved-items';
          }
        }
      );
    },
    onSettled: () => {
      // Always refetch saved items to ensure consistency
      queryClient.invalidateQueries({ queryKey: SAVED_ITEMS_QUERY_KEYS.all });
    },
  });
};