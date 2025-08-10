import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showStack?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <AlertTriangle size={48} className={styles.errorIcon} />
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.props.showStack && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className={styles.errorActions}>
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw size={16} />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}