import { useInfiniteQuery } from "@tanstack/react-query";
import { getSavedItemsList } from "../endpoints/saved-items/list_GET.schema";

const REQUEST_TIMEOUT = 10000; // 10 seconds

// Standardized query key constants
export const SAVED_ITEMS_QUERY_KEYS = {
  all: ["savedItems"] as const,
  list: (pageSize: number) => [...SAVED_ITEMS_QUERY_KEYS.all, "list", pageSize] as const,
} as const;

// Standardized stale times
const STALE_TIME_LIST = 5 * 60 * 1000; // 5 minutes for list queries

// Standardized error handler
const handleQueryError = (error: Error, context: string) => {
  console.error(`${context} error:`, error);
};

export const useSavedItems = (pageSize: number = 20) => {
  // Limit page size to prevent excessive data loading
  const limitedPageSize = Math.min(pageSize, 50);
  
  return useInfiniteQuery({
    queryKey: SAVED_ITEMS_QUERY_KEYS.list(limitedPageSize),
    queryFn: ({ pageParam = 1 }) =>
      getSavedItemsList({ 
        page: pageParam, 
        pageSize: limitedPageSize 
      }, { 
        signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
      }),
    getNextPageParam: (lastPage) => {
      const { totalCount, page, pageSize } = lastPage;
      if (page * pageSize < totalCount) {
        return page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    staleTime: STALE_TIME_LIST,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    maxPages: 10, // Limit to 10 pages to prevent excessive data loading
    meta: {
      onError: (error: Error) => handleQueryError(error, "Saved items list"),
    },
  });
};