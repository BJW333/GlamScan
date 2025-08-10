import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { FileDropzone } from '../components/FileDropzone';
import { useGenerateRecommendations } from '../helpers/useGenerateRecommendations';
import { useThrottledToast } from '../helpers/useThrottledToast';
import { useImageProcessing } from '../helpers/useImageProcessing';
import { Recommendation } from '../endpoints/recommendations/generate_POST.schema';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/Tooltip';
import { AlertTriangle, X, HelpCircle } from 'lucide-react';
import { Camera } from 'lucide-react';
import { ShoppingCart } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import styles from './dashboard.module.css';

const RecommendationCard = React.memo(({ recommendation }: { recommendation: Recommendation }) => (
  <div className={styles.recCard}>
    <img src={recommendation.imageUrl} alt={recommendation.name} className={styles.recImage} />
    <div className={styles.recContent}>
      <span className={styles.recType}>{recommendation.type}</span>
      <h3 className={styles.recName}>{recommendation.name}</h3>
      <p className={styles.recDescription}>{recommendation.description}</p>
      <div className={styles.recFooter}>
        <span className={styles.recPrice}>${recommendation.price.toFixed(2)}</span>
        <Button asChild size="sm" variant="secondary">
          <a href={recommendation.affiliateUrl} target="_blank" rel="noopener noreferrer">
            <ShoppingCart size={16} />
            Buy Now
          </a>
        </Button>
      </div>
    </div>
  </div>
));

RecommendationCard.displayName = 'RecommendationCard';

const RecommendationsSkeleton = React.memo(() => (
  <div className={styles.recommendationsGrid}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className={styles.recCard}>
        <Skeleton className={styles.recImageSkeleton} />
        <div className={styles.recContent}>
          <Skeleton style={{ width: '50px', height: '20px', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '80%', height: '24px', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ width: '100%', height: '16px' }} />
          <Skeleton style={{ width: '90%', height: '16px', marginTop: 'var(--spacing-1)' }} />
          <div className={styles.recFooter} style={{ marginTop: 'var(--spacing-4)' }}>
            <Skeleton style={{ width: '60px', height: '24px' }} />
            <Skeleton style={{ width: '100px', height: '32px' }} />
          </div>
        </div>
      </div>
    ))}
  </div>
));

RecommendationsSkeleton.displayName = 'RecommendationsSkeleton';

function DashboardPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [showOnboardingTooltip, setShowOnboardingTooltip] = useState(false);
  const lastImageBase64Ref = useRef<string | null>(null);
  const throttledToast = useThrottledToast();
  const { processImage, isProcessing: isProcessingImage } = useImageProcessing();
  const { mutate: generate, isPending: isGenerating, error } = useGenerateRecommendations({
    onSuccess: (data) => {
      setRecommendations(data.recommendations);
      if (data.recommendations.length > 0) {
        throttledToast.success(`Found ${data.recommendations.length} perfect recommendations for you!`, 'recommendations-success');
      }
      // Hide onboarding tooltip after first successful upload
      if (showOnboardingTooltip) {
        setShowOnboardingTooltip(false);
        localStorage.setItem('dashboard-onboarding-dismissed', 'true');
      }
    },
    onError: (error) => {
      console.error('Recommendation generation failed:', error);
    },
  });

  // Check if user is first-time visitor
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('dashboard-onboarding-dismissed');
    if (!hasSeenOnboarding && !recommendations) {
      setShowOnboardingTooltip(true);
    }
  }, [recommendations]);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    
    try {
      const result = await processImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
        format: 'jpeg'
      });
      
      // Store the base64 for retry functionality
      lastImageBase64Ref.current = result.base64;
      
      // Show processing feedback if significant size reduction
      if (result.originalSize > result.processedSize * 1.5) {
        throttledToast.success(
          `Image optimized: ${Math.round(result.originalSize / 1024)}KB → ${Math.round(result.processedSize / 1024)}KB`,
          'image-optimized'
        );
      }
      
      generate({ selfieBase64: result.base64 });
    } catch (error) {
      console.error("Image processing error:", error);
      throttledToast.error("Failed to process image. Please try a different photo.", 'image-processing-error');
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Style Dashboard | GlamScan</title>
        <meta name="description" content="Your personal AI style dashboard. Upload a selfie to get instant fashion and makeup recommendations tailored just for you." />
        <meta name="keywords" content="AI style scanner, fashion dashboard, makeup recommendations, selfie analysis, personal styling" />
        <link rel="canonical" href="/dashboard" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/dashboard" />
        <meta property="og:title" content="AI Style Dashboard | GlamScan" />
        <meta property="og:description" content="Your personal AI style dashboard. Upload a selfie to get instant fashion and makeup recommendations tailored just for you." />
        <meta property="og:site_name" content="GlamScan" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="AI Style Dashboard | GlamScan" />
        <meta property="twitter:description" content="Your personal AI style dashboard. Upload a selfie to get instant fashion and makeup recommendations tailored just for you." />
        
        {/* Additional SEO */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <ErrorBoundary>
        <div className={styles.pageContainer}>

        <main className={styles.mainContent}>
          <div className={styles.scannerSection}>
            <h2 className={styles.sectionTitle}>AI Style Scanner</h2>
            <p className={styles.sectionSubtitle}>Upload a clear, front-facing selfie to get your personalized recommendations.</p>
            <div className={styles.dropzoneContainer}>
              {showOnboardingTooltip && (
                <div className={styles.onboardingTooltip}>
                  <div className={styles.tooltipContent}>
                    <div className={styles.tooltipHeader}>
                      <HelpCircle size={20} className={styles.tooltipIcon} />
                      <span className={styles.tooltipTitle}>Welcome to GlamScan!</span>
                      <button 
                        onClick={() => {
                          setShowOnboardingTooltip(false);
                          localStorage.setItem('dashboard-onboarding-dismissed', 'true');
                        }}
                        className={styles.tooltipClose}
                        aria-label="Dismiss"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className={styles.tooltipText}>
                      Upload a clear, front-facing selfie to get personalized fashion and makeup recommendations powered by AI.
                    </p>
                    <div className={styles.tooltipTips}>
                      <strong>Quick tips:</strong>
                      <ul>
                        <li>Use good lighting</li>
                        <li>Face the camera directly</li>
                        <li>Avoid heavy filters</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <FileDropzone
                onFilesSelected={handleFileSelect}
                accept="image/jpeg, image/png"
                maxFiles={1}
                maxSize={5 * 1024 * 1024} // 5MB
                disabled={isGenerating || isProcessingImage}
                icon={<Camera size={48} />}
                title={isProcessingImage ? "Processing image..." : isGenerating ? "Analyzing your style..." : "Upload Your Selfie"}
                subtitle="PNG or JPG (max 5MB)"
              />
            </div>
          </div>

          <div className={styles.resultsSection}>
            {(isGenerating || isProcessingImage) && <RecommendationsSkeleton />}
            
            {error && (
              <div className={styles.errorState}>
                <AlertTriangle size={48} className={styles.errorIcon} />
                <h3 className={styles.errorTitle}>Unable to Generate Recommendations</h3>
                <p className={styles.errorMessage}>
                  We couldn't analyze your photo right now. This might be due to image quality or a temporary service issue. 
                  Please try uploading a clear, well-lit selfie.
                </p>
                <div className={styles.errorActions}>
                  <Button onClick={() => setRecommendations(null)} variant="outline">Try Different Photo</Button>
                  <Button 
                    onClick={() => {
                      if (lastImageBase64Ref.current) {
                        generate({ selfieBase64: lastImageBase64Ref.current });
                      }
                    }} 
                    variant="ghost"
                    disabled={!lastImageBase64Ref.current}
                  >
                    Retry Analysis
                  </Button>
                </div>
              </div>
            )}

            {!isGenerating && !isProcessingImage && recommendations && recommendations.length > 0 && (
              <>
                <h2 className={styles.sectionTitle}><Sparkles size={24} className={styles.sparkleIcon} /> Your Recommendations</h2>
                <div className={styles.recommendationsGrid}>
                  {recommendations.map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} />
                  ))}
                </div>
              </>
            )}

            {!isGenerating && !isProcessingImage && recommendations && recommendations.length === 0 && !error && (
               <div className={styles.emptyState}>
                <AlertTriangle size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No Recommendations Generated</h3>
                <p className={styles.emptyMessage}>
                  We couldn't generate recommendations from this image. For best results, try uploading a clear, 
                  front-facing selfie with good lighting.
                </p>
                <div className={styles.emptyActions}>
                  <Button onClick={() => setRecommendations(null)}>Upload New Photo</Button>
                </div>
              </div>
            )}

            {!isGenerating && !isProcessingImage && !recommendations && !error && (
              <div className={styles.emptyState}>
                <Sparkles size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>Ready to Discover Your Style?</h3>
                <p className={styles.emptyMessage}>
                  Upload a clear selfie and let our AI analyze your features to recommend the perfect makeup and fashion choices for you.
                </p>
                <div className={styles.emptyTips}>
                  <h4>Tips for best results:</h4>
                  <ul>
                    <li>Use good lighting</li>
                    <li>Face the camera directly</li>
                    <li>Keep your face clearly visible</li>
                    <li>Avoid heavy filters or makeup</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
        </div>
      </ErrorBoundary>
    </>
  );
}

export default DashboardPage;