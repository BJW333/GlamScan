import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { useUnreadNotificationCount } from "../helpers/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";
import styles from "./NotificationBell.module.css";

export const NotificationBell = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useUnreadNotificationCount();

  const unreadCount = data?.count ?? 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${styles.bellButton} ${className ?? ""}`}
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell size={20} />
          {unreadCount > 0 && !isLoading && (
            <Badge variant="destructive" className={styles.badge}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={styles.popoverContent}
        align="end"
        sideOffset={8}
        removeBackgroundAndPadding
      >
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};