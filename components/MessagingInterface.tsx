import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  useConversations,
  useConversation,
  useSendMessage,
  useMarkAsRead,
} from "../helpers/useMessaging";
import { useAuth } from "../helpers/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
import { Input } from "./Input";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Send } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import styles from "./MessagingInterface.module.css";
import { ConversationSummary } from "../endpoints/messages/conversations_GET.schema";
import { Message } from "../endpoints/messages/conversation_GET.schema";

const ConversationListSkeleton = React.memo(() => (
  <div className={styles.conversationItem}>
    <Skeleton style={{ width: "48px", height: "48px", borderRadius: "50%" }} />
    <div className={styles.conversationInfo}>
      <Skeleton style={{ height: "1.25rem", width: "100px", marginBottom: 'var(--spacing-1)' }} />
      <Skeleton style={{ height: "1rem", width: "150px" }} />
    </div>
  </div>
));

ConversationListSkeleton.displayName = 'ConversationListSkeleton';

const MessageSkeleton = React.memo(() => (
  <div className={styles.messageBubble}>
    <Skeleton style={{ height: "1rem", width: "120px" }} />
  </div>
));

MessageSkeleton.displayName = 'MessageSkeleton';

export const MessagingInterface = React.memo(({ className }: { className?: string }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const { authState } = useAuth();

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useConversations();

  const handleSelectConversation = useCallback((id: number) => {
    setSelectedConversationId(id);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const selectedConversation = conversations?.find(
    (c) => c.conversationId === selectedConversationId
  );

  return (
    <div className={`${styles.container} ${className ?? ""}`} role="main" aria-label="Messaging interface">
      <div className={`${styles.sidebar} ${selectedConversationId !== null ? styles.sidebarHidden : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2 id="conversations-heading">Messages</h2>
        </div>
        <div 
          className={styles.conversationList} 
          role="list" 
          aria-labelledby="conversations-heading"
          aria-live="polite"
        >
          {isLoadingConversations && Array.from({ length: 5 }).map((_, i) => <ConversationListSkeleton key={i} />)}
          {conversationsError && (
            <div className={styles.errorText} role="alert" aria-live="assertive">
              {conversationsError.message}
            </div>
          )}
          {conversations && conversations.length === 0 && (
            <div className={styles.emptyText} role="status">
              No conversations yet.
            </div>
          )}
          {conversations?.map((convo) => (
            <ConversationItem
              key={convo.conversationId}
              conversation={convo}
              isSelected={selectedConversationId === convo.conversationId}
              onSelect={handleSelectConversation}
              currentUserId={authState.type === 'authenticated' ? authState.user.id : -1}
            />
          ))}
        </div>
      </div>
      <div className={`${styles.chatPanel} ${selectedConversationId === null ? styles.chatPanelHidden : ""}`}>
        {selectedConversationId && selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBackToList}
          />
        ) : (
          <div className={styles.noChatSelected} role="status">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
});

MessagingInterface.displayName = 'MessagingInterface';

const ConversationItem = React.memo(({
  conversation,
  isSelected,
  onSelect,
  currentUserId,
}: {
  conversation: ConversationSummary;
  isSelected: boolean;
  onSelect: (id: number) => void;
  currentUserId: number;
}) => {
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
  const displayName = otherParticipant?.displayName ?? "Unknown User";
  const avatarUrl = otherParticipant?.avatarUrl;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(conversation.conversationId);
    }
  }, [onSelect, conversation.conversationId]);

  const handleClick = useCallback(() => {
    onSelect(conversation.conversationId);
  }, [onSelect, conversation.conversationId]);

  return (
    <div
      className={`${styles.conversationItem} ${isSelected ? styles.selected : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Conversation with ${displayName}${conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread messages` : ''}`}
    >
      <Avatar className={styles.conversationAvatar}>
        <AvatarImage src={avatarUrl ?? ""} alt={`${displayName}'s profile picture`} />
        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className={styles.conversationInfo}>
        <span className={styles.conversationName}>{displayName}</span>
        <p className={styles.lastMessage}>
          {conversation.lastMessage?.content ?? "No messages yet"}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <div 
          className={styles.unreadBadge} 
          aria-label={`${conversation.unreadCount} unread messages`}
        >
          {conversation.unreadCount}
        </div>
      )}
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

const ChatWindow = React.memo(({ conversation, onBack }: { conversation: ConversationSummary; onBack: () => void; }) => {
  const { authState } = useAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useConversation(conversation.conversationId);

  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markAsRead.mutate({ conversationId: conversation.conversationId });
    }
  }, [conversation.conversationId, conversation.unreadCount, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const handleSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      sendMessage.mutate({
        conversationId: conversation.conversationId,
        content: content.trim(),
        messageType: "text",
      });
      setContent("");
    }
  }, [content, sendMessage, conversation.conversationId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) {
        sendMessage.mutate({
          conversationId: conversation.conversationId,
          content: content.trim(),
          messageType: "text",
        });
        setContent("");
      }
    }
  }, [content, sendMessage, conversation.conversationId]);

  const messages = data?.pages.flatMap(p => p.messages) ?? [];
  const currentUserId = authState.type === 'authenticated' ? authState.user.id : -1;
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);

  return (
    <div className={styles.chatWindow} role="main" aria-label={`Chat with ${otherParticipant?.displayName}`}>
      <header className={styles.chatHeader}>
        <Button 
          variant="ghost" 
          size="icon" 
          className={styles.backButton} 
          onClick={onBack}
          aria-label="Back to conversations list"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Button>
        <Avatar className={styles.chatAvatar}>
          <AvatarImage src={otherParticipant?.avatarUrl ?? ""} alt={`${otherParticipant?.displayName}'s profile picture`} />
          <AvatarFallback>{otherParticipant?.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className={styles.chatName}>{otherParticipant?.displayName}</h3>
      </header>
      <main 
        className={styles.messageArea} 
        role="log" 
        aria-label="Messages"
        aria-live="polite"
      >
        {isLoading && Array.from({ length: 8 }).map((_, i) => <MessageSkeleton key={i} />)}
        {error && (
          <div className={styles.errorText} role="alert" aria-live="assertive">
            {error.message}
          </div>
        )}
        {messages.map((msg: Message) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${msg.senderId === currentUserId ? styles.sent : styles.received}`}
            role="article"
            aria-label={`Message ${msg.senderId === currentUserId ? 'sent by you' : `from ${otherParticipant?.displayName}`}`}
          >
            <div className={styles.messageBubble}>{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} aria-hidden="true" />
      </main>
      <footer className={styles.chatFooter}>
        <form onSubmit={handleSend} className={styles.messageForm} role="form" aria-label="Send message">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={styles.messageInput}
            autoComplete="off"
            aria-label="Message input"
            aria-describedby="send-help"
          />
          <div id="send-help" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={!content.trim() || sendMessage.isPending}
            aria-label="Send message"
          >
            <Send size={20} aria-hidden="true" />
          </Button>
        </form>
      </footer>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';