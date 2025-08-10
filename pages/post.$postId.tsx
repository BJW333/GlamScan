import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MessageCircle } from "lucide-react";
import { Share2 } from "lucide-react";
import { ArrowUp } from "lucide-react";
import { ArrowDown } from "lucide-react";
import { ShoppingBag } from "lucide-react";
import { usePostDetail } from '../helpers/usePostDetail';
import { Skeleton } from '../components/Skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '../components/Avatar';
import { Button } from '../components/Button';
import { CommentThread } from '../components/CommentThread';
import { SocialShareModal } from '../components/SocialShareModal';
import styles from "./post.$postId.module.css";

const PostDetailSkeleton = React.memo(() =>
<div className={styles.postCard}>
    <Skeleton className={styles.postImageSkeleton} />
    <div className={styles.postContent}>
      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <Skeleton style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
          <Skeleton style={{ width: "120px", height: "20px" }} />
        </div>
        <Skeleton style={{ width: "80px", height: "40px" }} />
      </div>
      <div className={styles.caption}>
        <Skeleton style={{ width: "80%", height: "16px" }} />
        <Skeleton style={{ width: "60%", height: "16px", marginTop: "8px" }} />
      </div>
      <div className={styles.stats}>
        <Skeleton style={{ width: "50px", height: "24px" }} />
        <Skeleton style={{ width: "50px", height: "24px" }} />
      </div>
    </div>
  </div>);

PostDetailSkeleton.displayName = 'PostDetailSkeleton';


function PostDetailPage() {
  const { postId } = useParams();
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const numericPostId = postId ? parseInt(postId, 10) : undefined;

  const { data: post, isLoading, error } = usePostDetail(numericPostId);

  const getInitials = (name: string) => {
    return name.
    split(" ").
    map((n) => n[0]).
    join("").
    toUpperCase();
  };

  if (isLoading) {
    return (
      <main className={styles.pageContainer}>
        <PostDetailSkeleton />
      </main>);

  }

  if (error || !post || (post && 'error' in post)) {
    const is404 = error?.status === 404 || error?.message?.includes('404');
    const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
    
    return (
      <main className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <h2>{is404 ? 'Post Not Found' : 'Unable to Load Post'}</h2>
          <p>
            {is404 
              ? "This post may have been removed or the link is incorrect."
              : isNetworkError
              ? "Please check your internet connection and try again."
              : "Something went wrong while loading this post. Please try again later."
            }
          </p>
          <div className={styles.errorActions}>
            <Link to="/hot-or-not">
              <Button>Back to Feed</Button>
            </Link>
            {!is404 && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </main>);

  }

  // Type assertion is safe here because we've ruled out the error case above
  const postData = post as Exclude<typeof post, { error: string }>;
  const shareUrl = `${window.location.origin}/post/${postData.id}`;
  const shareText = `Check out this style on GlamScan: ${postData.caption || 'A cool new look.'}`;

  return (
    <>
      <Helmet>
        <title>{`${postData.authorDisplayName}'s post | GlamScan`}</title>
        <meta name="description" content={postData.caption ?? "A style post on GlamScan."} />
        <meta property="og:title" content={`${postData.authorDisplayName}'s post on GlamScan`} />
        <meta property="og:description" content={postData.caption ?? "A style post on GlamScan."} />
        <meta property="og:image" content={postData.imageUrl} />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <main className={styles.pageContainer}>
        <div className={styles.postCard}>
          <img src={postData.imageUrl} alt={postData.caption ?? "Post image"} className={styles.postImage} />
          <div className={styles.postContent}>
            <div className={styles.header}>
              <Link to={`/profile/${postData.authorId}`} className={styles.authorInfo} aria-label={`View ${postData.authorDisplayName}'s profile`}>
                <Avatar>
                  <AvatarImage src={postData.authorAvatarUrl ?? undefined} />
                  <AvatarFallback>{getInitials(postData.authorDisplayName)}</AvatarFallback>
                </Avatar>
                <span className={styles.authorName}>{postData.authorDisplayName}</span>
              </Link>
              <Button variant="outline" onClick={() => setShareModalOpen(true)} aria-label="Share this post">
                <Share2 size={16} aria-hidden="true" />
                Share
              </Button>
            </div>
            {postData.caption && <p className={styles.caption}>{postData.caption}</p>}
            {postData.productTags &&
            <div className={styles.productTags}>
                {(postData.productTags as any[]).map((tag, index) =>
              <a
                key={index}
                href={tag.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.productTag}
                aria-label={`Shop ${tag.name} (opens in new tab)`}>

                    <ShoppingBag size={16} aria-hidden="true" />
                    <span>{tag.name}</span>
                  </a>
              )}
              </div>
            }
            <div className={styles.stats}>
              <div className={styles.voteCount} aria-label={`${postData.upvotes} upvotes`}>
                <ArrowUp size={20} aria-hidden="true" />
                <span>{postData.upvotes} Upvotes</span>
              </div>
              <div className={styles.voteCount} aria-label={`${postData.downvotes} downvotes`}>
                <ArrowDown size={20} aria-hidden="true" />
                <span>{postData.downvotes} downvotes</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.commentsSection}>
          <div className={styles.commentsHeader}>
            <MessageCircle size={24} aria-hidden="true" />
            <h3>Comments</h3>
          </div>
          <CommentThread postId={postData.id} />
        </div>
      </main>
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
        title={`${postData.authorDisplayName}'s post on GlamScan`}
        text={shareText} />

    </>);
}

export default PostDetailPage;