import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Camera, LogOut, Settings, User as UserIcon, Flame, Bell, Shield } from 'lucide-react';
import { useAuth } from './useAuth';
import { useIsMobile } from './useIsMobile';
import { Button } from '../components/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/Tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/Popover';
import { BottomNavigation } from '../components/BottomNavigation';
import styles from './SharedLayout.module.css';

export const SharedLayout = ({ children }: { children: React.ReactNode }) => {
  const { authState, logout } = useAuth();
  const isMobile = useIsMobile();
  const isAuthenticated = authState.type === 'authenticated';
  const user = isAuthenticated ? authState.user : null;
  const showBottomNav = isAuthenticated && isMobile;
  const [notificationPopoverOpen, setNotificationPopoverOpen] = React.useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = React.useState(false);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`${styles.layout} ${showBottomNav ? styles.withBottomNav : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Camera className={styles.logoIcon} />
            <span className={styles.logoText}>GlamScan</span>
          </Link>
          <nav className={styles.nav}>
            {isAuthenticated && (
              <NavLink to="/hot-or-not" className={styles.navLink}>
                <Flame size={20} />
                Hot or Not
              </NavLink>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <NavLink to="/admin" className={styles.navLink}>
                <Shield size={20} />
                Admin
              </NavLink>
            )}
          </nav>
          <div className={styles.actions}>
            {authState.type === 'loading' ? (
              <div className={styles.authLoading}></div>
            ) : isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className={styles.notificationButton} aria-label="Notifications">
                          <Bell size={20} />
                          <Badge variant="destructive" className={styles.notificationBadge}>
                            3
                          </Badge>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Notifications (Ctrl+Shift+N)
                      </TooltipContent>
                    </Tooltip>
                  </PopoverTrigger>
                  <PopoverContent align="end" className={styles.notificationPopoverContent}>
                    <NotificationDropdown onClose={() => setNotificationPopoverOpen(false)} />
                  </PopoverContent>
                </Popover>

                {/* User Avatar */}
                <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className={styles.avatarButton} aria-label="User menu">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                          </Avatar>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        User menu (Ctrl+Shift+U)
                      </TooltipContent>
                    </Tooltip>
                  </PopoverTrigger>
                  <PopoverContent align="end" className={styles.popoverContent}>
                    <div className={styles.popoverHeader}>
                      <p className={styles.popoverDisplayName}>{user.displayName}</p>
                      <p className={styles.popoverEmail}>{user.email}</p>
                    </div>
                    <div className={styles.popoverLinks}>
                      <Link to="/dashboard" className={styles.popoverLinkItem} onClick={() => setUserPopoverOpen(false)}>
                        <UserIcon size={16} />
                        <span>Profile</span>
                      </Link>
                      <Link to="/settings" className={styles.popoverLinkItem} onClick={() => setUserPopoverOpen(false)}>
                        <Settings size={16} />
                        <span>Settings</span>
                      </Link>
                      <button onClick={() => { logout(); setUserPopoverOpen(false); }} className={styles.popoverLinkItem}>
                        <LogOut size={16} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <div className={styles.authButtons}>
                <Button asChild variant="ghost">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/login?action=register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} GlamScan. All rights reserved.</p>
      </footer>
      <BottomNavigation />
      
      {/* Keyboard shortcuts */}
      {isAuthenticated && (
        <div style={{ display: 'none' }}>
          <div
            onKeyDown={(e) => {
              if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                setNotificationPopoverOpen(!notificationPopoverOpen);
              }
              if (e.ctrlKey && e.shiftKey && e.key === 'U') {
                e.preventDefault();
                setUserPopoverOpen(!userPopoverOpen);
              }
            }}
            tabIndex={-1}
          />
        </div>
      )}
    </div>
  );
};