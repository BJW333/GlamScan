import React, { useCallback, useRef, useMemo, useEffect } from 'react';

interface RenderOptimizationOptions {
  enabled?: boolean;
  debounceMs?: number;
  throttleMs?: number;
  maxRenderRate?: number; // renders per second
}

// Debounce hook with cleanup
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    }) as T,
    [delay]
  );
};

// Throttle hook with cleanup
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callbackRef.current(...args);
          timeoutRef.current = null;
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [delay]
  );
};

// Render rate limiter
export const useRenderOptimization = (
  componentName: string,
  options: RenderOptimizationOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    maxRenderRate = 60 // 60 FPS max
  } = options;

  const lastRenderRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const skipRenderRef = useRef<boolean>(false);

  const minRenderInterval = 1000 / maxRenderRate; // ms between renders

  // Check if render should be skipped
  const shouldSkipRender = useCallback(() => {
    if (!enabled) return false;

    const now = performance.now();
    const timeSinceLastRender = now - lastRenderRef.current;

    if (timeSinceLastRender < minRenderInterval) {
      skipRenderRef.current = true;
      return true;
    }

    lastRenderRef.current = now;
    renderCountRef.current += 1;
    skipRenderRef.current = false;
    return false;
  }, [enabled, minRenderInterval]);

  // Memoized value factory with dependency tracking
  const createMemoizedValue = useCallback(function<T>(
    factory: () => T,
    deps: React.DependencyList
  ): T {
    return useMemo(factory, deps);
  }, []);

  // Stable callback factory
  const createStableCallback = useCallback(function<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ): T {
    return useCallback(callback, deps);
  }, []);

  // Performance-optimized event handler
  const createOptimizedHandler = useCallback(function<T extends (...args: any[]) => any>(
    handler: T,
    options: { debounce?: number; throttle?: number } = {}
  ): T {
    if (options.debounce) {
      return useDebounce(handler, options.debounce);
    }
    if (options.throttle) {
      return useThrottle(handler, options.throttle);
    }
    return handler;
  }, []);

  return {
    shouldSkipRender,
    createMemoizedValue,
    createStableCallback,
    createOptimizedHandler,
    renderCount: renderCountRef.current,
    isRenderSkipped: skipRenderRef.current
  };
};

// Higher-order component for render optimization
export const withRenderOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options: RenderOptimizationOptions = {}
) => {
  const OptimizedComponent = React.memo((props: P) => {
    const { shouldSkipRender } = useRenderOptimization(
      Component.displayName || Component.name || 'Anonymous',
      options
    );

    if (shouldSkipRender()) {
      return null; // Skip render
    }

    return <Component {...props} />;
  });

  OptimizedComponent.displayName = `withRenderOptimization(${Component.displayName || Component.name || 'Anonymous'})`;

  return OptimizedComponent;
};

// Intersection observer hook with cleanup
export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create observer
  const observe = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries, observer) => callbackRef.current(entries, observer),
      options
    );

    observerRef.current.observe(element);
  }, [options]);

  // Cleanup observer
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return disconnect;
  }, [disconnect]);

  return { observe, disconnect };
};