import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getFeed,
  InputType as FeedInputType,
  OutputType as FeedOutputType,
} from "../endpoints/posts/feed_GET.schema";
import {
  postCreate,
  InputType as CreateInputType,
} from "../endpoints/posts/create_POST.schema";
import {
  postVote,
  InputType as VoteInputType,
} from "../endpoints/posts/vote_POST.schema";
import {
  getComments,
  InputType as CommentsInputType,
} from "../endpoints/posts/comments_GET.schema";
import {
  postComment,
  InputType as PostCommentInputType,
} from "../endpoints/posts/comments_POST.schema";

const REQUEST_TIMEOUT = 10000; // 10 seconds

// Standardized query key constants
export const POST_QUERY_KEYS = {
  all: ["posts"] as const,
  feed: (params: any) => [...POST_QUERY_KEYS.all, "feed", params] as const,
  comments: (postId: number) => [...POST_QUERY_KEYS.all, "comments", postId] as const,
} as const;

// Standardized stale times
const STALE_TIME_LIST = 5 * 60 * 1000; // 5 minutes for feed
const STALE_TIME_FREQUENT = 1 * 60 * 1000; // 1 minute for frequently changing data

// Standardized error handler
const handleQueryError = (error: Error, context: string) => {
  console.error(`${context} error:`, error);
  // Could add toast notification here if needed
};

export const usePostFeed = (params: Omit<FeedInputType, "cursor">) => {
  return useInfiniteQuery<FeedOutputType>({
    queryKey: POST_QUERY_KEYS.feed(params),
    queryFn: ({ pageParam }) => getFeed({ 
      ...params, 
      cursor: pageParam as number | undefined,
      limit: Math.min(params.limit || 10, 20) // Limit to max 20 items per page
    }, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    placeholderData: (previousData) => previousData,
    staleTime: STALE_TIME_LIST,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    maxPages: 5, // Limit to 5 pages to prevent excessive data loading
    meta: {
      onError: (error: Error) => handleQueryError(error, "Post feed"),
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInputType) => postCreate(data, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: () => {
      // Invalidate the feed query to show the new post
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.all,
      });
    },
    onError: (error: Error) => {
      handleQueryError(error, "Create post");
    },
  });
};

export const useVotePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VoteInputType) => postVote(data, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: () => {
      // Invalidate both feed and saved items queries to update vote counts
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.all,
      });
      // Also invalidate saved items in case the voted post is saved
      queryClient.invalidateQueries({
        queryKey: ["saved-items"],
      });
    },
    onError: (error: Error) => {
      handleQueryError(error, "Vote post");
    },
  });
};

export const usePostComments = (params: CommentsInputType) => {
  return useQuery({
    queryKey: POST_QUERY_KEYS.comments(params.postId),
    queryFn: () => getComments(params, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    enabled: !!params.postId, // Only run query if postId is provided
    staleTime: STALE_TIME_FREQUENT, // Comments change more frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Standardized retry count for queries
    placeholderData: (previousData) => previousData,
    meta: {
      onError: (error: Error) => handleQueryError(error, "Post comments"),
    },
  });
};

export const usePostComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostCommentInputType) => postComment(data, { 
      signal: AbortSignal.timeout(REQUEST_TIMEOUT) 
    }),
    retry: 1, // Standardized retry count for mutations
    onSuccess: (newComment, variables) => {
      // Invalidate the comments for the specific post to show the new one
      // Use postId from the response if available, otherwise fall back to the input postId
      const postId = newComment.postId || variables.postId;
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.comments(postId),
      });
      // Also invalidate feed to update comment counts
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.all,
      });
    },
    onError: (error: Error) => {
      handleQueryError(error, "Post comment");
    },
  });
};