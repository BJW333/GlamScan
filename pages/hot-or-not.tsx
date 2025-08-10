import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import useEmblaCarousel from "embla-carousel-react";
import { Plus, Camera, X } from "lucide-react";
import { usePostFeed, useCreatePost } from "../helpers/usePostApi";
import { useSavedItems } from "../helpers/useSavedItems";
import { PostFeedItem } from "../endpoints/posts/feed_GET.schema";
import { ProductTag } from "../endpoints/posts/create_POST.schema";
import { HotOrNotPost } from "../components/HotOrNotPost";
import { HotOrNotFeedSkeleton } from "../components/HotOrNotFeedSkeleton";
import { Spinner } from "../components/Spinner";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/Dialog";
import { toast } from "sonner";
import styles from "./hot-or-not.module.css";

function HotOrNotPage() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = usePostFeed({ limit: 15 });

  const createPostMutation = useCreatePost();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "y",
    loop: false,
    align: "start",
    watchDrag: true,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [productTags, setProductTags] = useState<ProductTag[]>([]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const { data: savedItemsData } = useSavedItems();
  
  // Helper function to check if a post is saved
  const isPostSaved = useCallback((postId: number): boolean => {
    if (!savedItemsData) return false;
    
    const allSavedItems = savedItemsData.pages.flatMap((page) => page.savedItems);
    return allSavedItems.some((item) => 
      item.itemType === "post" && item.id === postId
    );
  }, [savedItemsData]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (
      emblaApi &&
      hasNextPage &&
      !isFetchingNextPage &&
      posts.length > 0 &&
      activeIndex >= posts.length - 5
    ) {
      fetchNextPage();
    }
  }, [
    activeIndex,
    emblaApi,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    posts.length,
  ]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        image: selectedImage,
        caption: caption.trim() || undefined,
        productTags: productTags.length > 0 ? productTags : undefined,
      });

      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setCaption("");
      setProductTags([]);
      setShowCreateModal(false);

      // Refresh feed and show success message
      refetch();
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    }
  };

  const resetCreateForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption("");
    setProductTags([]);
  };

  const renderContent = () => {
    if (isFetching && !data) {
      return <HotOrNotFeedSkeleton />;
    }

    if (error) {
      return (
        <div className={styles.centeredMessage}>
          <p>Error loading feed: {error.message}</p>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className={styles.centeredMessage}>
          <h2>No posts yet!</h2>
          <p>Be the first to share your style.</p>
        </div>
      );
    }

    return (
      <div className={styles.embla} ref={emblaRef}>
        <div className={styles.emblaContainer}>
          {posts.map((post: PostFeedItem, index: number) => (
            <div className={styles.emblaSlide} key={post.id}>
              <HotOrNotPost
                post={post}
                isActive={index === activeIndex}
                isSaved={isPostSaved(post.id)}
                onNext={() => emblaApi?.scrollNext()}
                onPrev={() => emblaApi?.scrollPrev()}
              />
            </div>
          ))}
          {isFetchingNextPage && (
            <div className={`${styles.emblaSlide} ${styles.loaderSlide}`}>
              <Spinner size="lg" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Hot or Not Style Feed | GlamScan</title>
        <meta
          name="description"
          content="Vote on the latest styles and trends in our Hot or Not feed. Discover what's trending in fashion and beauty right now."
        />
        <meta name="keywords" content="fashion trends, style voting, hot or not, fashion feed, style community, trending outfits" />
        <link rel="canonical" href="/hot-or-not" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/hot-or-not" />
        <meta property="og:title" content="Hot or Not Style Feed | GlamScan" />
        <meta property="og:description" content="Vote on the latest styles and trends in our Hot or Not feed. Discover what's trending in fashion and beauty right now." />
        <meta property="og:site_name" content="GlamScan" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="Hot or Not Style Feed | GlamScan" />
        <meta property="twitter:description" content="Vote on the latest styles and trends in our Hot or Not feed. Discover what's trending in fashion and beauty right now." />
        
        {/* Additional SEO */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <main className={styles.pageContainer}>
        {renderContent()}
        
        {/* Floating Create Post Button */}
        <Button
          size="icon-lg"
          className={styles.createButton}
          onClick={() => setShowCreateModal(true)}
          aria-label="Create new post"
        >
          <Plus size={24} />
        </Button>

        {/* Create Post Modal */}
        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            resetCreateForm();
          }
        }}>
          <DialogContent className={styles.createModal}>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your style with the community. Upload a photo and add a caption.
              </DialogDescription>
            </DialogHeader>

            <div className={styles.createForm}>
              {/* Image Upload */}
              <div className={styles.imageUploadSection}>
                {imagePreview ? (
                  <div className={styles.imagePreview}>
                    <img src={imagePreview} alt="Preview" className={styles.previewImage} />
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      className={styles.removeImageButton}
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <label className={styles.imageUploadArea}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className={styles.hiddenInput}
                    />
                    <Camera size={48} className={styles.uploadIcon} />
                    <span className={styles.uploadText}>Click to upload image</span>
                    <span className={styles.uploadSubtext}>JPEG, PNG, or WebP (max 5MB)</span>
                  </label>
                )}
              </div>

              {/* Caption Input */}
              <div className={styles.inputGroup}>
                <label htmlFor="caption" className={styles.label}>
                  Caption (optional)
                </label>
                <Textarea
                  id="caption"
                  placeholder="Tell us about your style..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={2200}
                />
                <div className={styles.characterCount}>
                  {caption.length}/2200
                </div>
              </div>

              {/* Product Tags Note */}
              <div className={styles.productTagsNote}>
                <p className={styles.noteText}>
                  💡 Product tagging will be available after uploading your image
                </p>
              </div>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createPostMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!selectedImage || createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      Creating...
                    </>
                  ) : (
                    'Create Post'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

export default HotOrNotPage;