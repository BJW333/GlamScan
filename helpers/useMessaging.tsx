import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getConversations,
  ConversationSummary,
} from "../endpoints/messages/conversations_GET.schema";
import {
  getConversation,
  InputType as GetConversationInput,
  Message,
} from "../endpoints/messages/conversation_GET.schema";
import {
  postSend,
  InputType as SendMessageInput,
} from "../endpoints/messages/send_POST.schema";
import {
  postMarkRead,
  InputType as MarkReadInput,
} from "../endpoints/messages/mark-read_POST.schema";

const REQUEST_TIMEOUT = 10000; // 10 seconds

// Standardized query key constants
export const MESSAGING_QUERY_KEYS = {
  all: ["messages"] as const,
  conversations: () => [...MESSAGING_QUERY_KEYS.all, "conversations"] as const,
  conversation: (conversationId: number) => [...MESSAGING_QUERY_KEYS.all, "conversation", conversationId] as const,
} as const;

// Standardized stale times
const STALE_TIME_LIST = 5 * 60 * 1000; // 5 minutes for conversations list
const STALE_TIME_FREQUENT = 1 * 60 * 1000; // 1 minute for frequently changing data

// Standardized error handler
const handleQueryError = (error: Error, context: string) => {
  console.error(`${context} error:`, error);
};

/**
 * Fetches the list of user's conversations.
 */
export const useConversations = () => {
  return useQuery({
    queryKey: MESSAGING_QUERY_KEYS.conversations(),
    queryFn: () => getConversations({ 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    staleTime: STALE_TIME_LIST,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    placeholderData: (previousData) => previousData,
    refetchInterval: 120000, // Reduced polling to every 2 minutes
    refetchIntervalInBackground: false, // Only poll when window is focused
    meta: {
      onError: (error: Error) => handleQueryError(error, "Conversations list"),
    },
  });
};

/**
 * Fetches messages for a single conversation with infinite scrolling.
 */
export const useConversation = (conversationId: number) => {
  return useInfiniteQuery<
    { messages: Message[]; nextCursor: string | null },
    Error,
    { pages: { messages: Message[]; nextCursor: string | null }[]; pageParams: (string | undefined)[] },
    (string | number)[],
    string | undefined
  >({
    queryKey: [...MESSAGING_QUERY_KEYS.conversation(conversationId)] as (string | number)[],
    queryFn: ({ pageParam }) =>
      getConversation({ 
        conversationId, 
        cursor: pageParam, 
        limit: Math.min(20, 50) // Limit messages per page
      }, { 
        signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    placeholderData: (previousData) => previousData,
    staleTime: STALE_TIME_FREQUENT, // Messages change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    refetchInterval: 60000, // Reduced polling to every 60 seconds
    refetchIntervalInBackground: false, // Only poll when window is focused
    maxPages: 20, // Limit to 20 pages to prevent excessive data loading
    meta: {
      onError: (error: Error) => handleQueryError(error, "Conversation messages"),
    },
  });
};

/**
 * Mutation to send a new message.
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newMessage: SendMessageInput) => postSend(newMessage, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: (sentMessage) => {
      // Invalidate conversations list to update last message and unread count
      queryClient.invalidateQueries({ queryKey: MESSAGING_QUERY_KEYS.conversations() });

      // Optimistically add the new message to the conversation cache
      queryClient.setQueryData(
        MESSAGING_QUERY_KEYS.conversation(sentMessage.conversationId),
        (oldData: any) => {
          if (!oldData) return oldData;

          const firstPage = oldData.pages[0];
          // Mark the sent message as read for the sender to prevent unread badges
          const messageWithRead = {
            ...sentMessage,
            readBy: sentMessage.readBy || [sentMessage.senderId],
          };
          const newFirstPage = {
            ...firstPage,
            messages: [messageWithRead, ...firstPage.messages],
          };

          return {
            ...oldData,
            pages: [newFirstPage, ...oldData.pages.slice(1)],
          };
        }
      );
    },
    onError: (error: Error) => {
      handleQueryError(error, "Send message");
    },
  });
};

/**
 * Mutation to mark all messages in a conversation as read.
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkReadInput) => postMarkRead(data, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: (data, variables) => {
      if (data.success && data.markedAsReadCount > 0) {
        // Invalidate conversations to update unread count
        queryClient.invalidateQueries({ queryKey: MESSAGING_QUERY_KEYS.conversations() });
        // Could also refetch the specific conversation if needed
        // queryClient.invalidateQueries({ queryKey: MESSAGING_QUERY_KEYS.conversation(variables.conversationId) });
      }
    },
    onError: (error: Error) => {
      handleQueryError(error, "Mark messages as read");
    },
  });
};