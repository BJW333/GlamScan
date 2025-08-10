import React from "react";
import { Link } from "react-router-dom";
import {
  useNotificationsList,
  useMarkNotificationsRead,
} from "../helpers/useNotifications";
import {
  Bell,
  MessageSquare,
  UserPlus,
  Heart,
  AtSign,
  Check,
} from "lucide-react";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
import styles from "./NotificationDropdown.module.css";
import { Selectable } from "kysely";
import { Notifications } from "../helpers/schema";

const NOTIFICATION_ICONS = {
  message: MessageSquare,
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  post_like: Heart,
  comment: MessageSquare,
  mention: AtSign,
};

const NotificationSkeleton = () => (
  <div className={styles.notificationItem}>
    <Skeleton style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
    <div className={styles.notificationContent}>
      <Skeleton style={{ height: "1rem", width: "80%" }} />
      <Skeleton style={{ height: "0.8rem", width: "50%" }} />
    </div>
  </div>
);

export const NotificationDropdown = ({
  className,
  onClose,
}: {
  className?: string;
  onClose: () => void;
}) => {
  const { data, isLoading, error } = useNotificationsList({ page: 1, limit: 10 });
  const markReadMutation = useMarkNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadIds = notifications
    .filter((n) => !n.isRead)
    .map((n) => n.id);

  const handleMarkAllRead = () => {
    if (unreadIds.length > 0) {
      markReadMutation.mutate({ notificationIds: unreadIds });
    }
  };

  const getNotificationLink = (notification: Selectable<Notifications>) => {
    // In a real app, this would link to specific pages, e.g., /messages/123, /posts/456
    // For now, we'll use placeholder links.
    switch (notification.type) {
      case "message":
        return "/messages";
      case "friend_request":
      case "friend_accepted":
        return "/friends";
      case "post_like":
      case "comment":
      case "mention":
        return "/posts"; // Placeholder
      default:
        return "#";
    }
  };

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      <header className={styles.header}>
        <h3 className={styles.title}>Notifications</h3>
        {unreadIds.length > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markReadMutation.isPending}
            aria-label={`Mark ${unreadIds.length} notifications as read`}
          >
            <Check size={16} aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </header>
      <div className={styles.notificationList}>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        {error && <p className={styles.errorText}>{error.message}</p>}
        {!isLoading && notifications.length === 0 && (
          <div className={styles.emptyState}>
            <Bell size={48} className={styles.emptyIcon} />
            <p>No new notifications</p>
            <span>You're all caught up!</span>
          </div>
        )}
        {notifications.map((notification) => {
          const Icon =
            NOTIFICATION_ICONS[notification.type] || Bell;
          return (
            <Link
              to={getNotificationLink(notification)}
              key={notification.id}
              className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ""}`}
              onClick={onClose}
              aria-label={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.message}`}
            >
              <div className={styles.iconWrapper}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className={styles.notificationContent}>
                <p className={styles.notificationMessage}>
                  {notification.message}
                </p>
                <time className={styles.notificationTime}>
                  {(() => {
                    if (!notification.createdAt) return 'Unknown time';
                    const date = new Date(notification.createdAt);
                    return isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
                  })()}
                </time>
              </div>
              {!notification.isRead && <div className={styles.unreadDot} />}
            </Link>
          );
        })}
      </div>
      <footer className={styles.footer}>
        <Link to="/notifications" onClick={onClose}>
          <Button variant="ghost" className={styles.viewAllButton} aria-label="View all notifications page">
            View all notifications
          </Button>
        </Link>
      </footer>
    </div>
  );
};