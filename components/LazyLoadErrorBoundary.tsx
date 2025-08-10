import React, { Component, ReactNode } from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import styles from './LazyLoadErrorBoundary.module.css';

interface LazyLoadErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface LazyLoadErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyLoadErrorBoundary extends Component<
  LazyLoadErrorBoundaryProps,
  LazyLoadErrorBoundaryState
> {
  constructor(props: LazyLoadErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyLoadErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorContainer} role="alert">
          <div className={styles.errorContent}>
            <AlertTriangle className={styles.errorIcon} aria-hidden="true" />
            <h3 className={styles.errorTitle}>
              Failed to load {this.props.componentName || 'component'}
            </h3>
            <p className={styles.errorMessage}>
              There was an error loading this part of the application. 
              Please check your connection and try again.
            </p>
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}