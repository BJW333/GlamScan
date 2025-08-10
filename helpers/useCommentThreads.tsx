import { useState, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getComments,
  InputType as CommentsInputType,
  CommentWithAuthor,
} from '../endpoints/posts/comments_GET.schema';
import {
  postComment,
  InputType as PostCommentInputType,
} from '../endpoints/posts/comments_POST.schema';
import { useAuth } from './useAuth';
import { nanoid } from 'nanoid';

const COMMENT_QUERY_KEY_PREFIX = 'comments';

/**
 * Fetches and manages state for a post's comment threads.
 * @param postId The ID of the post.
 */
export const useCommentThreads = (postId: number) => {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );

  const queryKey = [COMMENT_QUERY_KEY_PREFIX, postId];

  const { data, isLoading, isError, error } = useQuery<CommentWithAuthor[]>({
    queryKey,
    queryFn: () => getComments({ postId }).then((res) => res.comments),
    enabled: !!postId,
  });

  const toggleExpand = useCallback((commentId: number) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    expandedComments,
    toggleExpand,
  };
};

/**
 * Provides a mutation for adding a new comment or a reply.
 * Handles optimistic updates for a smooth user experience.
 * @param postId The ID of the post to which the comment is being added.
 */
export const useAddComment = (postId: number) => {
  const queryClient = useQueryClient();
  const { authState } = useAuth();
  const queryKey = [COMMENT_QUERY_KEY_PREFIX, postId];

  return useMutation({
    mutationFn: (data: PostCommentInputType) => postComment(data),
    onMutate: async (newCommentData) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousComments =
        queryClient.getQueryData<CommentWithAuthor[]>(queryKey) ?? [];

      // Optimistically update to the new value
      if (authState.type === 'authenticated') {
        const optimisticComment: CommentWithAuthor = {
          id: -Math.random(), // Temporary negative ID
          content: newCommentData.content,
          createdAt: new Date(),
          parentId: newCommentData.parentId ?? null,
          replyCount: 0,
          authorId: authState.user.id,
          authorDisplayName: authState.user.displayName,
          authorAvatarUrl: authState.user.avatarUrl,
          replies: [],
        };

        const addCommentToTree = (
          comments: CommentWithAuthor[],
          comment: CommentWithAuthor,
        ): CommentWithAuthor[] => {
          if (comment.parentId === null) {
            return [...comments, comment];
          }

          return comments.map((c) => {
            if (c.id === comment.parentId) {
              return {
                ...c,
                replies: [...(c.replies ?? []), comment],
                replyCount: (c.replyCount ?? 0) + 1,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: addCommentToTree(c.replies, comment),
              };
            }
            return c;
          });
        };

        const newComments = addCommentToTree(
          previousComments,
          optimisticComment,
        );
        queryClient.setQueryData(queryKey, newComments);
      }

      // Return a context object with the snapshotted value
      return { previousComments };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newComment, context) => {
      console.error('Error posting comment:', err);
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
    },
    // Always refetch after error or success to ensure data consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};