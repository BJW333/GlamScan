import React, { useState, useRef, useEffect } from 'react';
import {
  useCommentThreads,
  useAddComment,
} from '../helpers/useCommentThreads';
import { CommentWithAuthor } from '../endpoints/posts/comments_GET.schema';
import { useAuth } from '../helpers/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { Skeleton } from './Skeleton';
import { Spinner } from './Spinner';
import { calculateInitials } from '../helpers/calculateInitials';
import { MessageSquare, CornerDownRight, Send, ChevronDown } from 'lucide-react';
import styles from './CommentThread.module.css';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
});
type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onSuccess?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId = null,
  onSuccess,
  autoFocus = false,
  placeholder = 'Add a comment...',
}) => {
  const { authState } = useAuth();
  const addCommentMutation = useAddComment(postId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const onSubmit: SubmitHandler<CommentFormData> = (data) => {
    addCommentMutation.mutate(
      {
        postId,
        content: data.content,
        parentId: parentId || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      },
    );
  };

  if (authState.type !== 'authenticated') {
    return (
      <p className={styles.loginPrompt}>Please log in to leave a comment.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.commentForm}>
      <Avatar className={styles.formAvatar}>
        <AvatarImage src={authState.user.avatarUrl ?? undefined} />
        <AvatarFallback>
          {authState.user.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={styles.formInputWrapper}>
        <Textarea
          {...register('content')}
          ref={textareaRef}
          placeholder={placeholder}
          disabled={isSubmitting}
          rows={1}
          className={styles.formTextarea}
        />
        {errors.content && (
          <p className={styles.formError}>{errors.content.message}</p>
        )}
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={isSubmitting}
        aria-label="Post comment"
      >
        {isSubmitting ? <Spinner size="sm" /> : <Send size={16} />}
      </Button>
    </form>
  );
};

interface CommentItemProps {
  comment: CommentWithAuthor;
  postId: number;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  level: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  isExpanded,
  onToggleExpand,
  level,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;



  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className={styles.commentItem}
      style={{ '--level': level } as React.CSSProperties}
    >
      <div className={styles.commentWrapper}>
        <Avatar className={styles.commentAvatar}>
          <AvatarImage src={comment.authorAvatarUrl ?? undefined} />
          <AvatarFallback>{calculateInitials(comment.authorDisplayName)}</AvatarFallback>
        </Avatar>
        <div className={styles.commentBody}>
          <div className={styles.commentHeader}>
            <span className={styles.authorName}>{comment.authorDisplayName}</span>
            <span className={styles.timestamp}>
              {comment.createdAt ? formatTimestamp(new Date(comment.createdAt)) : 'Unknown'}
            </span>
          </div>
          <p className={styles.commentContent}>{comment.content}</p>
          <div className={styles.commentActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageSquare size={14} />
              Reply
            </Button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className={styles.replyFormContainer}>
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => {
              setIsReplying(false);
              if (!isExpanded) onToggleExpand(comment.id);
            }}
            autoFocus
            placeholder={`Replying to ${comment.authorDisplayName}...`}
          />
        </div>
      )}

      {hasReplies && (
        <div className={styles.repliesSection}>
          <Button
            variant="link"
            size="sm"
            onClick={() => onToggleExpand(comment.id)}
            className={styles.viewRepliesButton}
          >
            <ChevronDown
              size={16}
              className={`${styles.chevronIcon} ${isExpanded ? styles.expanded : ''}`}
            />
            {isExpanded ? 'Hide replies' : `View ${comment.replyCount} replies`}
          </Button>
          {isExpanded && (
            <div className={styles.repliesList}>
              {comment.replies?.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isExpanded={isExpanded} // For now, deeply nested replies are always shown if parent is expanded
                  onToggleExpand={onToggleExpand}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CommentThreadSkeleton: React.FC = () => (
  <div className={styles.skeletonContainer}>
    {[...Array(3)].map((_, i) => (
      <div key={i} className={styles.skeletonItem}>
        <Skeleton
          style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%' }}
        />
        <div className={styles.skeletonContent}>
          <Skeleton style={{ width: '120px', height: '1rem' }} />
          <Skeleton style={{ width: '100%', height: '2.5rem' }} />
        </div>
      </div>
    ))}
  </div>
);

interface CommentThreadProps {
  postId: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ postId }) => {
  const {
    data,
    isLoading,
    isError,
    error,
    expandedComments,
    toggleExpand,
  } = useCommentThreads(postId);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Comments ({data ? data.length : 0})
      </h3>
      <div className={styles.mainCommentForm}>
        <CommentForm postId={postId} />
      </div>
      <div className={styles.commentsContainer}>
        {isLoading && <CommentThreadSkeleton />}
        {isError && (
          <p className={styles.error}>
            Error loading comments: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}
        {data &&
          data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              isExpanded={expandedComments.has(comment.id)}
              onToggleExpand={toggleExpand}
              level={0}
            />
          ))}
      </div>
    </div>
  );
};