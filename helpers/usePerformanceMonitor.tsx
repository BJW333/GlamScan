import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  memoryUsage?: number;
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  trackMemory?: boolean;
  sampleRate?: number; // 0-1, percentage of renders to track
}

// Global performance metrics store for development
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000; // Prevent memory leaks in dev mode

export const usePerformanceMonitor = (
  componentName: string,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logToConsole = false,
    trackMemory = false,
    sampleRate = 0.1
  } = options;

  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const shouldTrackRef = useRef<boolean>(false);

  // Start performance tracking
  const startTracking = useCallback(() => {
    if (!enabled) return;
    
    // Sample based on sampleRate to avoid performance overhead
    shouldTrackRef.current = Math.random() < sampleRate;
    
    if (shouldTrackRef.current) {
      renderStartRef.current = performance.now();
    }
  }, [enabled, sampleRate]);

  // End performance tracking
  const endTracking = useCallback(() => {
    if (!enabled || !shouldTrackRef.current) return;

    const renderTime = performance.now() - renderStartRef.current;
    renderCountRef.current += 1;

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now(),
    };

    // Track memory usage if enabled and available
    if (trackMemory && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      metrics.memoryUsage = memoryInfo.usedJSHeapSize;
    }

    // Store metrics (with size limit to prevent memory leaks)
    performanceMetrics.push(metrics);
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }

    // Log to console if enabled
    if (logToConsole) {
      console.log(`🔍 ${componentName} render #${renderCountRef.current}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        memoryUsage: metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
    }
  }, [enabled, componentName, trackMemory, logToConsole]);

  // Track component renders
  useEffect(() => {
    startTracking();
    return endTracking;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear component-specific metrics on unmount to prevent memory leaks
      const componentMetrics = performanceMetrics.filter(m => m.componentName !== componentName);
      performanceMetrics.length = 0;
      performanceMetrics.push(...componentMetrics);
    };
  }, [componentName]);

  return {
    getMetrics: () => performanceMetrics.filter(m => m.componentName === componentName),
    getAllMetrics: () => [...performanceMetrics],
    clearMetrics: () => {
      const otherMetrics = performanceMetrics.filter(m => m.componentName !== componentName);
      performanceMetrics.length = 0;
      performanceMetrics.push(...otherMetrics);
    },
    renderCount: renderCountRef.current
  };
};

// Global performance utilities
export const getPerformanceReport = () => {
  const report = performanceMetrics.reduce((acc, metric) => {
    if (!acc[metric.componentName]) {
      acc[metric.componentName] = {
        totalRenders: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        totalRenderTime: 0
      };
    }

    const component = acc[metric.componentName];
    component.totalRenders += 1;
    component.totalRenderTime += metric.renderTime;
    component.maxRenderTime = Math.max(component.maxRenderTime, metric.renderTime);
    component.minRenderTime = Math.min(component.minRenderTime, metric.renderTime);
    component.averageRenderTime = component.totalRenderTime / component.totalRenders;

    return acc;
  }, {} as Record<string, any>);

  return report;
};

export const clearAllPerformanceMetrics = () => {
  performanceMetrics.length = 0;
};