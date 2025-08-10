import React, { useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Camera, Flame, Heart, Home, Package } from 'lucide-react';
import { useAuth } from '../helpers/useAuth';
import { useIsMobile } from '../helpers/useIsMobile';
import styles from './BottomNavigation.module.css';

const navItems = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    path: '/style-combos',
    label: 'Combos',
    icon: Package,
  },
  {
    path: '/hot-or-not',
    label: 'Hot or Not',
    icon: Flame,
  },
  {
    path: '/saved-items',
    label: 'Saved',
    icon: Heart,
  },
];

export const BottomNavigation = () => {
  const { authState } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleKeyDown = useCallback((e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Navigation will be handled by NavLink
    }
  }, []);

  // Don't render during loading state to prevent flash
  if (authState.type === 'loading' || authState.type !== 'authenticated' || !isMobile) {
    return null;
  }

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <nav className={styles.container} role="navigation" aria-label="Main navigation">
        <div className={styles.navList}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
              // Remove end prop to allow dashboard to stay highlighted on nested routes
              aria-current={location.pathname.startsWith(item.path) ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}${location.pathname.startsWith(item.path) ? ' (current page)' : ''}`}
              onKeyDown={(e) => handleKeyDown(e, item.path)}
            >
              <div className={styles.iconWrapper}>
                <item.icon
                  className={styles.icon}
                  aria-hidden="true"
                  strokeWidth={
                    location.pathname.startsWith(item.path) ? 2.5 : 2
                  }
                />
                {/* 
                  TODO: Add badge for saved items count when API is available.
                  Example:
                  {item.path === '/saved-items' && savedItemsCount > 0 && (
                    <span className={styles.badge} aria-label={`${savedItemsCount} saved items`}>{savedItemsCount}</span>
                  )}
                */}
              </div>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};