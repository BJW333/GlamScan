import { useEffect, useRef, useCallback } from 'react';

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  componentName?: string;
}

interface MemoryTrackerOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  logToConsole?: boolean;
  trackComponent?: boolean;
}

// Global memory tracking store
const memorySnapshots: MemorySnapshot[] = [];
const MAX_SNAPSHOTS = 500; // Prevent memory leaks

let globalTrackingInterval: NodeJS.Timeout | null = null;
let trackingComponents = new Set<string>();

export const useMemoryTracker = (
  componentName?: string,
  options: MemoryTrackerOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    interval = 5000, // 5 seconds
    logToConsole = false,
    trackComponent = true
  } = options;

  const lastSnapshotRef = useRef<MemorySnapshot | null>(null);
  const componentMountedRef = useRef(true);

  // Check if memory API is available
  const isMemoryAPIAvailable = useCallback(() => {
    return 'memory' in performance && typeof (performance as any).memory === 'object';
  }, []);

  // Take memory snapshot
  const takeSnapshot = useCallback((compName?: string): MemorySnapshot | null => {
    if (!enabled || !isMemoryAPIAvailable()) return null;

    const memoryInfo = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      componentName: compName
    };

    // Store snapshot with size limit
    memorySnapshots.push(snapshot);
    if (memorySnapshots.length > MAX_SNAPSHOTS) {
      memorySnapshots.shift();
    }

    return snapshot;
  }, [enabled, isMemoryAPIAvailable]);

  // Detect memory leaks
  const detectMemoryLeak = useCallback((threshold: number = 10 * 1024 * 1024): boolean => {
    if (memorySnapshots.length < 2) return false;

    const recent = memorySnapshots.slice(-10); // Last 10 snapshots
    const first = recent[0];
    const last = recent[recent.length - 1];

    return (last.usedJSHeapSize - first.usedJSHeapSize) > threshold;
  }, []);

  // Get memory usage for component
  const getComponentMemoryUsage = useCallback(() => {
    if (!componentName) return null;

    const componentSnapshots = memorySnapshots.filter(s => s.componentName === componentName);
    if (componentSnapshots.length === 0) return null;

    const latest = componentSnapshots[componentSnapshots.length - 1];
    const oldest = componentSnapshots[0];

    return {
      current: latest.usedJSHeapSize,
      growth: latest.usedJSHeapSize - oldest.usedJSHeapSize,
      snapshots: componentSnapshots.length
    };
  }, [componentName]);

  // Start global memory tracking
  useEffect(() => {
    if (!enabled || !isMemoryAPIAvailable()) return;

    // Add component to tracking set
    if (componentName && trackComponent) {
      trackingComponents.add(componentName);
    }

    // Start global interval if not already running
    if (!globalTrackingInterval && trackingComponents.size > 0) {
      globalTrackingInterval = setInterval(() => {
        const snapshot = takeSnapshot();
        
        if (snapshot && logToConsole) {
          const memoryMB = (snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2);
          const isLeak = detectMemoryLeak();
          
          console.log(`🧠 Memory Usage: ${memoryMB}MB${isLeak ? ' ⚠️ Potential leak detected!' : ''}`);
        }
      }, interval);
    }

    return () => {
      componentMountedRef.current = false;
      
      // Remove component from tracking
      if (componentName) {
        trackingComponents.delete(componentName);
      }

      // Clear global interval if no components are tracking
      if (trackingComponents.size === 0 && globalTrackingInterval) {
        clearInterval(globalTrackingInterval);
        globalTrackingInterval = null;
      }
    };
  }, [enabled, componentName, trackComponent, interval, logToConsole, isMemoryAPIAvailable, takeSnapshot, detectMemoryLeak]);

  // Take initial snapshot for component
  useEffect(() => {
    if (enabled && componentName && trackComponent) {
      const snapshot = takeSnapshot(componentName);
      lastSnapshotRef.current = snapshot;
    }
  }, [enabled, componentName, trackComponent, takeSnapshot]);

  return {
    takeSnapshot: () => takeSnapshot(componentName),
    getSnapshots: () => memorySnapshots.filter(s => !componentName || s.componentName === componentName),
    getAllSnapshots: () => [...memorySnapshots],
    detectMemoryLeak,
    getComponentMemoryUsage,
    isMemoryAPIAvailable: isMemoryAPIAvailable(),
    clearSnapshots: () => {
      const otherSnapshots = memorySnapshots.filter(s => s.componentName !== componentName);
      memorySnapshots.length = 0;
      memorySnapshots.push(...otherSnapshots);
    }
  };
};

// Global memory utilities
export const getMemoryReport = () => {
  if (memorySnapshots.length === 0) return null;

  const latest = memorySnapshots[memorySnapshots.length - 1];
  const oldest = memorySnapshots[0];

  return {
    current: {
      used: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      total: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      limit: (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
    },
    growth: {
      absolute: ((latest.usedJSHeapSize - oldest.usedJSHeapSize) / 1024 / 1024).toFixed(2) + 'MB',
      percentage: (((latest.usedJSHeapSize - oldest.usedJSHeapSize) / oldest.usedJSHeapSize) * 100).toFixed(2) + '%'
    },
    snapshots: memorySnapshots.length,
    timespan: latest.timestamp - oldest.timestamp
  };
};

export const clearAllMemorySnapshots = () => {
  memorySnapshots.length = 0;
};