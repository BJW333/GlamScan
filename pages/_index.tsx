import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight } from 'lucide-react';
import { Camera } from 'lucide-react';
import { Heart } from 'lucide-react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthSuspense } from '../components/AuthSuspense';
import { useAuth } from '../helpers/useAuth';
import styles from './_index.module.css';

// Component for auth-aware CTAs
const AuthAwareCTA: React.FC = () => {
  // This is safe to use inside AuthSuspense
  const { authState } = useAuth();
  const isAuthenticated = authState.type === 'authenticated';

  return (
    <Button asChild size="lg" className={styles.ctaButton}>
      <Link to={isAuthenticated ? "/dashboard" : "/login?action=register"}>
        {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
        <ArrowRight size={20} />
      </Link>
    </Button>
  );
};

// Component for auth-aware final CTA
const AuthAwareFinalCTA: React.FC = () => {
  const { authState } = useAuth();
  const isAuthenticated = authState.type === 'authenticated';

  return (
    <Button asChild size="lg" className={styles.ctaButton}>
      <Link to={isAuthenticated ? "/dashboard" : "/login?action=register"}>
        {isAuthenticated ? 'Open My Dashboard' : 'Sign Up Now'}
        <ArrowRight size={20} />
      </Link>
    </Button>
  );
};

function IndexPage() {
  return (
    <>
      <Helmet>
        <title>GlamScan | AI-Powered Fashion & Makeup Recommendations</title>
        <meta
          name="description"
          content="Discover your perfect style with GlamScan. Get personalized outfit and makeup recommendations from a single selfie. Shop the looks you love and join a community of style enthusiasts."
        />
        <meta name="keywords" content="AI fashion, makeup recommendations, style scanner, outfit suggestions, fashion AI, beauty tech, personal styling" />
        <meta name="author" content="GlamScan" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:title" content="GlamScan | AI-Powered Fashion & Makeup Recommendations" />
        <meta property="og:description" content="Discover your perfect style with GlamScan. Get personalized outfit and makeup recommendations from a single selfie." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&w=1200&h=630&fit=crop" />
        <meta property="og:site_name" content="GlamScan" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="/" />
        <meta property="twitter:title" content="GlamScan | AI-Powered Fashion & Makeup Recommendations" />
        <meta property="twitter:description" content="Discover your perfect style with GlamScan. Get personalized outfit and makeup recommendations from a single selfie." />
        <meta property="twitter:image" content="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&w=1200&h=630&fit=crop" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="theme-color" content="#e91e63" />
      </Helmet>
      <div className={styles.pageContainer}>
        <main>
          {/* Hero Section */}
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Your Style,
                <br />
                Instantly Scanned.
              </h1>
              <p className={styles.heroSubtitle}>
                Unlock personalized fashion and makeup recommendations with a single selfie.
                Welcome to the future of style discovery.
              </p>
              <div className={styles.heroActions}>
                <AuthSuspense
                  loadingTitle="Loading..."
                  fallback={
                    <Button size="lg" className={styles.ctaButton} disabled>
                      Loading...
                    </Button>
                  }
                >
                  <AuthAwareCTA />
                </AuthSuspense>
                <Button asChild variant="link" size="lg" className={styles.secondaryButton}>
                  <Link to="#features">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            <div className={styles.heroImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3"
                alt="Stylish woman shopping"
                className={styles.heroImage}
              />
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className={styles.features}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>How GlamScan Works</h2>
              <p className={styles.sectionSubtitle}>
                Three simple steps to revolutionize your style.
              </p>
            </div>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Camera size={32} />
                </div>
                <h3 className={styles.featureTitle}>1. Scan Your Selfie</h3>
                <p className={styles.featureDescription}>
                  Our advanced AI analyzes your unique features to understand what complements you best.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Heart size={32} />
                </div>
                <h3 className={styles.featureTitle}>2. Get Recommendations</h3>
                <p className={styles.featureDescription}>
                  Receive instant, personalized outfit and makeup suggestions curated just for you.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <ShoppingBag size={32} />
                </div>
                <h3 className={styles.featureTitle}>3. Shop & Share</h3>
                <p className={styles.featureDescription}>
                  Purchase recommended items directly and share your new looks with the community.
                </p>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className={styles.finalCta}>
            <div className={styles.finalCtaContent}>
              <h2 className={styles.finalCtaTitle}>Ready to Find Your Signature Look?</h2>
              <p className={styles.finalCtaText}>
                Join thousands of users discovering their best selves. Your style journey starts now.
              </p>
              <AuthSuspense
                loadingTitle="Loading..."
                fallback={
                  <Button size="lg" className={styles.ctaButton} disabled>
                    Loading...
                  </Button>
                }
              >
                <AuthAwareFinalCTA />
              </AuthSuspense>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default IndexPage;