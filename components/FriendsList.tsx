import React, { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import {
  useFriendsList,
  useUserSearch,
  useSendFriendRequest,
  useRespondToFriendRequest,
  FriendListFilter,
} from "../helpers/useFriends";
import {
  UserPlus,
  Search,
  Check,
  X,
  Clock,
  Users,
  UserCheck,
  Mail,
} from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
import { Skeleton } from "./Skeleton";
import styles from "./FriendsList.module.css";

type Tab = "friends" | "pending" | "add";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "friends", label: "Friends", icon: Users },
  { id: "pending", label: "Pending", icon: Mail },
  { id: "add", label: "Add Friend", icon: UserPlus },
];

const FriendItemSkeleton = () => (
  <div className={styles.friendItem}>
    <Skeleton style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
    <div className={styles.friendInfo}>
      <Skeleton style={{ height: "1.25rem", width: "120px" }} />
    </div>
    <Skeleton style={{ height: "36px", width: "80px" }} />
  </div>
);

export const FriendsList = ({ className }: { className?: string }) => {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const {
    data: friends,
    isLoading: isLoadingFriends,
    error: friendsError,
  } = useFriendsList("all");
  const {
    data: pending,
    isLoading: isLoadingPending,
    error: pendingError,
  } = useFriendsList("pending_received");
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useUserSearch(debouncedSearchQuery);

  const sendRequestMutation = useSendFriendRequest();
  const respondRequestMutation = useRespondToFriendRequest();

  const renderContent = () => {
    if (activeTab === "friends") {
      if (isLoadingFriends)
        return Array.from({ length: 3 }).map((_, i) => (
          <FriendItemSkeleton key={i} />
        ));
      if (friendsError)
        return <p className={styles.errorText}>{friendsError.message}</p>;
      if (!friends || friends.length === 0)
        return <p className={styles.emptyText}>You have no friends yet.</p>;
      return (
        <div className={styles.list}>
          {friends.map((friend) => (
            <div key={friend.id} className={styles.friendItem}>
              <Avatar>
                <AvatarImage src={friend.avatarUrl ?? ""} alt={friend.displayName} />
                <AvatarFallback>
                  {friend.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className={styles.friendName}>{friend.displayName}</p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "pending") {
      if (isLoadingPending)
        return Array.from({ length: 2 }).map((_, i) => (
          <FriendItemSkeleton key={i} />
        ));
      if (pendingError)
        return <p className={styles.errorText}>{pendingError.message}</p>;
      if (!pending || pending.length === 0)
        return (
          <p className={styles.emptyText}>No pending friend requests.</p>
        );
      return (
        <div className={styles.list}>
          {pending.map((req) => (
            <div key={req.id} className={styles.friendItem}>
              <Avatar>
                <AvatarImage src={req.avatarUrl ?? ""} alt={req.displayName} />
                <AvatarFallback>{req.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className={styles.friendName}>{req.displayName}</p>
              <div className={styles.actions}>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  onClick={() =>
                    respondRequestMutation.mutate({
                      requesterId: req.id,
                      action: "accept",
                    })
                  }
                  disabled={respondRequestMutation.isPending}
                  aria-label={`Accept friend request from ${req.displayName}`}
                >
                  <Check size={16} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={() =>
                    respondRequestMutation.mutate({
                      requesterId: req.id,
                      action: "decline",
                    })
                  }
                  disabled={respondRequestMutation.isPending}
                  aria-label={`Decline friend request from ${req.displayName}`}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "add") {
      return (
        <div className={styles.addFriendContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <Input
              type="search"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.list}>
            {isSearching && debouncedSearchQuery.length >= 2 && (
              <FriendItemSkeleton />
            )}
            {searchError && (
              <p className={styles.errorText}>{searchError.message}</p>
            )}
            {searchResults &&
              searchResults.map((user) => (
                <div key={user.id} className={styles.friendItem}>
                  <Avatar>
                    <AvatarImage src={user.avatarUrl ?? ""} alt={user.displayName} />
                    <AvatarFallback>
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className={styles.friendName}>{user.displayName}</p>
                  <div className={styles.actions}>
                    {user.friendStatus === "accepted" ? (
                      <Button size="sm" disabled variant="ghost">
                        <UserCheck size={16} /> Friends
                      </Button>
                    ) : user.friendStatus === "pending" ? (
                      <Button size="sm" disabled variant="ghost">
                        <Clock size={16} /> Pending
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          sendRequestMutation.mutate({ addresseeId: user.id })
                        }
                        disabled={sendRequestMutation.isPending}
                      >
                        <UserPlus size={16} /> Add
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            {searchResults && searchResults.length === 0 && debouncedSearchQuery.length >= 2 && (
              <p className={styles.emptyText}>No users found.</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${styles.container} ${className ?? ""}`}>
      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(id)}
            role="tab"
            aria-selected={activeTab === id}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className={styles.content} role="tabpanel">
        {renderContent()}
      </div>
    </div>
  );
};