import { ReactNode, Suspense, useRef, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./Tooltip";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";
import { AuthProvider } from "../helpers/useAuth";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthLoadingState } from "./AuthLoadingState";

// Create QueryClient with enhanced cleanup and cancellation
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  const queryClientRef = useRef<QueryClient | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Initialize QueryClient with proper cleanup
  if (!queryClientRef.current) {
    queryClientRef.current = createQueryClient();
  }

  // Global cleanup on unmount
  useEffect(() => {
    const queryClient = queryClientRef.current;
    
    return () => {
      // Cancel all ongoing queries and mutations
      if (queryClient) {
        queryClient.cancelQueries();
        queryClient.clear();
      }
      
      // Run all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      cleanupFunctionsRef.current = [];
    };
  }, []);

  // Register global event listeners cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (queryClientRef.current) {
        queryClientRef.current.cancelQueries();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && queryClientRef.current) {
        // Cancel queries when page becomes hidden to prevent memory leaks
        queryClientRef.current.cancelQueries();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <ScrollToHashElement />
      <ErrorBoundary
        fallback={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            padding: 'var(--spacing-4)'
          }}>
            <div style={{ 
              color: 'var(--error)', 
              textAlign: 'center', 
              fontWeight: '500' 
            }}>
              Application failed to load. Please refresh the page.
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <AuthLoadingState title="Loading application..." />
          }
        >
          <AuthProvider>
            <TooltipProvider>
              {children}
              <SonnerToaster />
            </TooltipProvider>
          </AuthProvider>
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};
