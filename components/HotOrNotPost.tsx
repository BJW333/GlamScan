import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, X, MessageCircle, Share2, ArrowUp, ArrowDown, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { PostFeedItem } from "../endpoints/posts/feed_GET.schema";
import { useVotePost } from "../helpers/usePostApi";
import { useToggleSaveItem } from "../helpers/useToggleSaveItem";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
import { Button } from "./Button";
import { CommentModal } from "./CommentModal";
import { SocialShareModal } from "./SocialShareModal";
import { OptimizedImage } from "./OptimizedImage";
import { calculateInitials } from "../helpers/calculateInitials";
import styles from "./HotOrNotPost.module.css";

interface HotOrNotPostProps {
  post: PostFeedItem;
  isActive: boolean;
  isSaved: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export const HotOrNotPost = React.memo(({
  post,
  isActive,
  isSaved,
  onNext,
}: HotOrNotPostProps) => {
  const [isCommentPanelOpen, setCommentPanelOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState(isSaved);
  const voteMutation = useVotePost();
  const toggleSaveMutation = useToggleSaveItem();

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const handleVote = (voteType: "upvote" | "downvote") => {
    if (voteMutation.isPending) return;

    voteMutation.mutate(
      { postId: post.id, voteType },
      {
        onSuccess: () => {
          toast.success(voteType === "upvote" ? "Liked!" : "Skipped!");
          setTimeout(onNext, 300); // Give time for feedback before moving
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to vote"
          );
        },
      }
    );
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleToggleSave = () => {
    if (toggleSaveMutation.isPending) return;

    // Optimistic update
    const newSavedState = !optimisticSaved;
    setOptimisticSaved(newSavedState);

    toggleSaveMutation.mutate(
      { itemId: post.id, itemType: "post" },
      {
        onSuccess: (data) => {
          setOptimisticSaved(data.saved);
          toast.success(data.saved ? "Post saved!" : "Post removed from saved items");
        },
        onError: (error) => {
          // Revert optimistic update on error
          setOptimisticSaved(!newSavedState);
          toast.error(
            error instanceof Error ? error.message : "Failed to save post"
          );
        },
      }
    );
  };



  return (
    <>
      <div className={styles.postContainer}>
        <OptimizedImage
          src={post.imageUrl}
          alt={post.caption ?? "Fashion post image"}
          className={styles.postImage}
          priority={isActive}
          aspectRatio="1"
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="skeleton"
          fallbackSrc="/placeholder-image.jpg"
        />
        <div className={styles.overlay}>
          <div className={styles.header}>
            <Link 
              to={`/profile/${post.authorId}`} 
              className={styles.authorInfo}
              aria-label={`View ${post.authorDisplayName}'s profile`}
            >
              <Avatar>
                <AvatarImage src={post.authorAvatarUrl ?? undefined} />
                <AvatarFallback>{calculateInitials(post.authorDisplayName)}</AvatarFallback>
              </Avatar>
              <span className={styles.authorName}>{post.authorDisplayName}</span>
            </Link>
          </div>

          <div className={styles.content}>
            <div className={styles.mainContent}>
              <p className={styles.caption}>{post.caption}</p>
              {post.productTags && (
                <div className={styles.productTags}>
                  {(post.productTags as any[]).map((tag, index) => (
                    <a
                      key={index}
                      href={tag.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.productTag}
                      aria-label={`Shop ${tag.name}`}
                    >
                      <ShoppingBag size={16} aria-hidden="true" />
                      <span>{tag.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.actions}>
              <div className={styles.voteButtons}>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className={`${styles.actionButton} ${styles.downvoteButton}`}
                  onClick={() => handleVote("downvote")}
                  onKeyDown={(e) => handleKeyDown(e, () => handleVote("downvote"))}
                  aria-label="Skip this post"
                  disabled={voteMutation.isPending}
                >
                  <X size={32} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className={`${styles.actionButton} ${styles.upvoteButton}`}
                  onClick={() => handleVote("upvote")}
                  onKeyDown={(e) => handleKeyDown(e, () => handleVote("upvote"))}
                  aria-label="Like this post"
                  disabled={voteMutation.isPending}
                >
                  <Heart size={32} aria-hidden="true" />
                </Button>
              </div>
              <div className={styles.sideActions}>
                <button 
                  className={`${styles.sideActionButton} ${optimisticSaved ? styles.saved : ''}`} 
                  onClick={handleToggleSave}
                  onKeyDown={(e) => handleKeyDown(e, handleToggleSave)}
                  aria-label={optimisticSaved ? "Remove from saved items" : "Save this post"}
                  aria-pressed={optimisticSaved}
                  disabled={toggleSaveMutation.isPending}
                >
                  <Heart size={28} fill={optimisticSaved ? "currentColor" : "none"} aria-hidden="true" />
                  <span className="sr-only">
                    {optimisticSaved ? "Saved" : "Not saved"}
                  </span>
                </button>
                <button 
                  className={styles.sideActionButton} 
                  onClick={() => setCommentPanelOpen(true)}
                  onKeyDown={(e) => handleKeyDown(e, () => setCommentPanelOpen(true))}
                  aria-label="View comments"
                  aria-pressed={isCommentPanelOpen}
                >
                  <MessageCircle size={28} aria-hidden="true" />
                  <span className="sr-only">
                    {isCommentPanelOpen ? "Comments open" : "Comments closed"}
                  </span>
                </button>
                <button 
                  className={styles.sideActionButton} 
                  onClick={handleShare}
                  onKeyDown={(e) => handleKeyDown(e, handleShare)}
                  aria-label="Share this post"
                  aria-pressed={isShareModalOpen}
                >
                  <Share2 size={28} aria-hidden="true" />
                  <span className="sr-only">
                    {isShareModalOpen ? "Share menu open" : "Share menu closed"}
                  </span>
                </button>
                <div className={styles.voteCount} aria-label={`${post.upvotes} likes`}>
                  <ArrowUp size={20} aria-hidden="true" />
                  <span>{post.upvotes}</span>
                </div>
                <div className={styles.voteCount} aria-label={`${post.downvotes} dislikes`}>
                  <ArrowDown size={20} aria-hidden="true" />
                  <span>{post.downvotes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CommentModal
        postId={post.id}
        isOpen={isCommentPanelOpen}
        onClose={() => setCommentPanelOpen(false)}
      />
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={`${window.location.origin}/post/${post.id}`}
        title="Check out this style on GlamScan!"
        text={post.caption ?? "A cool new look."}
      />
    </>
  );
});

HotOrNotPost.displayName = 'HotOrNotPost';