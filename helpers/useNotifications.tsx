import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsList,
  InputType as ListInputType,
} from "../endpoints/notifications/list_GET.schema";
import { getUnreadNotificationCount } from "../endpoints/notifications/unread-count_GET.schema";
import { postMarkNotificationsRead } from "../endpoints/notifications/mark-read_POST.schema";
import { toast } from "sonner";

const REQUEST_TIMEOUT = 10000; // 10 seconds

// Standardized query key constants
export const NOTIFICATIONS_QUERY_KEYS = {
  all: ["notifications"] as const,
  list: (filters: any) => [...NOTIFICATIONS_QUERY_KEYS.all, "list", filters] as const,
  unreadCount: () => [...NOTIFICATIONS_QUERY_KEYS.all, "unread-count"] as const,
} as const;

// Standardized stale times
const STALE_TIME_LIST = 5 * 60 * 1000; // 5 minutes for list queries
const STALE_TIME_FREQUENT = 1 * 60 * 1000; // 1 minute for frequently changing data

// Standardized error handler
const handleQueryError = (error: Error, context: string) => {
  console.error(`${context} error:`, error);
};

export const useNotificationsList = (filters: ListInputType) => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.list(filters),
    queryFn: () => getNotificationsList(filters, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    placeholderData: (previousData) => previousData,
    staleTime: STALE_TIME_LIST,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    meta: {
      onError: (error: Error) => handleQueryError(error, "Notifications list"),
    },
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount(),
    queryFn: () => getUnreadNotificationCount({ 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    staleTime: STALE_TIME_FREQUENT, // Unread count changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    placeholderData: (previousData) => previousData,
    meta: {
      onError: (error: Error) => handleQueryError(error, "Unread notification count"),
    },
  });
};

export const useMarkNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => postMarkNotificationsRead(data, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: (data, variables) => {
      if (data.updatedCount > 0) {
        toast.success(`${data.updatedCount} notification(s) marked as read.`);
        // Invalidate all queries related to notifications to refetch
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all });
        // Specifically invalidate the unread count query to clear header badges instantly
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount() });
      }
    },
    onError: (error) => {
      handleQueryError(error, "Mark notifications read");
      toast.error(
        `Failed to mark notifications as read: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    },
  });
};