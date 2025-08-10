import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const INTENDED_PATH_KEY = 'floot_intended_path';

export const useDeepLinkAuth = () => {
  const { authState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Store the current path when user is not authenticated
  const storeIntendedPath = useCallback((path: string) => {
    // Don't store auth-related paths
    if (path.includes('/login') || path.includes('/register') || path.includes('/auth')) {
      return;
    }
    sessionStorage.setItem(INTENDED_PATH_KEY, path);
  }, []);

  // Restore the intended path after authentication
  const restoreIntendedPath = useCallback(() => {
    const intendedPath = sessionStorage.getItem(INTENDED_PATH_KEY);
    if (intendedPath) {
      sessionStorage.removeItem(INTENDED_PATH_KEY);
      navigate(intendedPath, { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  // Clear stored path
  const clearIntendedPath = useCallback(() => {
    sessionStorage.removeItem(INTENDED_PATH_KEY);
  }, []);

  // Auto-handle deep link flow
  useEffect(() => {
    if (authState.type === 'unauthenticated') {
      // Store current path if user is trying to access a protected route
      const currentPath = location.pathname + location.search + location.hash;
      storeIntendedPath(currentPath);
    } else if (authState.type === 'authenticated') {
      // Try to restore intended path after successful authentication
      restoreIntendedPath();
    }
  }, [authState.type, location, storeIntendedPath, restoreIntendedPath]);

  return {
    storeIntendedPath,
    restoreIntendedPath,
    clearIntendedPath,
    hasStoredPath: () => !!sessionStorage.getItem(INTENDED_PATH_KEY),
  };
};