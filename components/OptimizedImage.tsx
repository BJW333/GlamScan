import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from './Skeleton';
import styles from './OptimizedImage.module.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
}

export const OptimizedImage = React.memo<OptimizedImageProps>(({
  src,
  alt,
  className = '',
  aspectRatio,
  sizes = '100vw',
  priority = false,
  placeholder = 'skeleton',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  objectFit = 'cover'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const preloadLinkRef = useRef<HTMLLinkElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Generate srcset for responsive images
  const generateSrcSet = useCallback((baseSrc: string) => {
    if (!baseSrc) return '';
    
    // Extract file extension and base URL
    const lastDotIndex = baseSrc.lastIndexOf('.');
    const baseUrl = lastDotIndex > 0 ? baseSrc.substring(0, lastDotIndex) : baseSrc;
    const extension = lastDotIndex > 0 ? baseSrc.substring(lastDotIndex) : '';
    
    // Generate different sizes (assuming the image service supports size parameters)
    const sizes = [400, 800, 1200, 1600];
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=75${extension} ${size}w`)
      .join(', ');
  }, []);

  // Cleanup function for intersection observer
  const cleanupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Cleanup function for preload link
  const cleanupPreloadLink = useCallback(() => {
    if (preloadLinkRef.current && document.head.contains(preloadLinkRef.current)) {
      try {
        document.head.removeChild(preloadLinkRef.current);
      } catch (error) {
        // Link might have already been removed
        console.warn('Failed to remove preload link:', error);
      }
      preloadLinkRef.current = null;
    }
  }, []);

  // Cleanup function for abort controller
  const cleanupAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    // Create new abort controller for this effect
    abortControllerRef.current = new AbortController();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && isMountedRef.current) {
          setIsInView(true);
          cleanupObserver();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      cleanupObserver();
      cleanupAbortController();
    };
  }, [priority, cleanupObserver, cleanupAbortController]);

  // Handle image load with memory leak prevention
  const handleLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error with fallback and memory leak prevention
  const handleError = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      onError?.();
    }
  }, [fallbackSrc, currentSrc, onError]);

  // Preload critical images with proper cleanup
  useEffect(() => {
    if (priority && src) {
      // Clean up any existing preload link first
      cleanupPreloadLink();
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (sizes) link.setAttribute('imagesizes', sizes);
      
      // Store reference for cleanup
      preloadLinkRef.current = link;
      document.head.appendChild(link);
    }

    return cleanupPreloadLink;
  }, [priority, src, sizes, cleanupPreloadLink]);

  // Update src when prop changes
  useEffect(() => {
    if (src !== currentSrc && !hasError) {
      setCurrentSrc(src);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src, currentSrc, hasError]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupObserver();
      cleanupPreloadLink();
      cleanupAbortController();
    };
  }, [cleanupObserver, cleanupPreloadLink, cleanupAbortController]);

  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatio || 'auto',
    position: 'relative',
    overflow: 'hidden'
  };

  const imageStyle: React.CSSProperties = {
    objectFit,
    transition: 'opacity var(--animation-duration-normal) ease',
    opacity: isLoaded ? 1 : 0
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${className}`}
      style={containerStyle}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className={styles.blurPlaceholder}
          aria-hidden="true"
        />
      )}

      {/* Skeleton placeholder */}
      {placeholder === 'skeleton' && !isLoaded && !hasError && (
        <Skeleton className={styles.skeleton} />
      )}

      {/* Error state */}
      {hasError && (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>📷</div>
          <span className={styles.errorText}>Image unavailable</span>
        </div>
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={generateSrcSet(currentSrc)}
          sizes={sizes}
          alt={alt}
          className={styles.image}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';