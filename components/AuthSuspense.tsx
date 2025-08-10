import React, { Suspense } from 'react';
import { useAuth } from '../helpers/useAuth';
import { AuthLoadingState } from './AuthLoadingState';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './AuthSuspense.module.css';

interface AuthSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingTitle?: string;
  showErrorBoundary?: boolean;
}

/**
 * AuthSuspense provides a Suspense boundary specifically for auth-dependent content.
 * It prevents flash of unauthenticated content and provides proper loading states.
 * Use this to wrap parts of your UI that depend on authentication state.
 */
export const AuthSuspense: React.FC<AuthSuspenseProps> = ({
  children,
  fallback,
  loadingTitle = "Loading...",
  showErrorBoundary = true,
}) => {
  const content = (
    <Suspense
      fallback={
        fallback || (
          <div className={styles.loadingContainer}>
            <AuthLoadingState title={loadingTitle} />
          </div>
        )
      }
    >
      <AuthAwareContent>{children}</AuthAwareContent>
    </Suspense>
  );

  if (showErrorBoundary) {
    return (
      <ErrorBoundary
        fallback={
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              Authentication failed. Please try refreshing the page.
            </div>
          </div>
        }
      >
        {content}
      </ErrorBoundary>
    );
  }

  return content;
};

/**
 * Internal component that safely accesses auth context
 */
const AuthAwareContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { authState } = useAuth();
    
    // Show loading state while auth is being determined
    if (authState.type === 'loading') {
      return (
        <div className={styles.loadingContainer}>
          <AuthLoadingState title="Authenticating..." />
        </div>
      );
    }

    // Render children once auth state is determined
    return <>{children}</>;
  } catch (error) {
    // If useAuth throws (provider not ready), show loading
    return (
      <div className={styles.loadingContainer}>
        <AuthLoadingState title="Initializing..." />
      </div>
    );
  }
};