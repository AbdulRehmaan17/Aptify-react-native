import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { chatService } from '../../src/services/chatService';
import { Chat } from '../../src/types';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { ChatCardSkeleton } from '../../components/SkeletonComponents';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { Card } from '../../src/components/layout/Card';

type ChatWithUser = Chat & {
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
};

const isMyMessage = (message: Chat['lastMessage'], userId?: string): boolean => {
  return message?.senderId === userId;
};

export default function MessagesScreen() {
  const { user, isGuest } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screen fade-in animation
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const screenSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let isMounted = true;
    
    if (isGuest || !user) {
      setLoading(false);
      Animated.parallel([
        Animated.timing(screenFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(screenSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    const unsubscribe = chatService.subscribeToUserChats(user.uid, user, async (updatedChats) => {
      if (!isMounted) return;
      
      try {
        setError(null);
        const safeChats = Array.isArray(updatedChats) ? updatedChats : [];
        const chatsWithUserInfo = await Promise.all(
          safeChats.map(async (chat) => {
            const otherUserId = chat.participants.find((id) => id !== user.uid) || '';
            const userInfo = await chatService.getUserInfo(otherUserId);

            return {
              ...chat,
              otherUserId,
              otherUserName: userInfo?.displayName || userInfo?.email || 'Unknown User',
              otherUserPhoto: userInfo?.photoURL,
            };
          })
        );

        if (isMounted) {
          setChats(chatsWithUserInfo);
          setLoading(false);
          setRefreshing(false);
        }
      } catch (err: any) {
        if (__DEV__) {
          console.warn('🔥 FIRESTORE WARNING: Failed to load chat user info:', {
            message: err?.message,
          });
        }
        if (isMounted) {
          setError('Setting things up… This may take a moment.');
          setLoading(false);
        }
      }
    });

    Animated.parallel([
      Animated.timing(screenFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(screenSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, isGuest]);

  const onRefresh = async () => {
    setRefreshing(true);
  };

  const formatTimestamp = (date?: Date): string => {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }

    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleChatPress = (chat: ChatWithUser) => {
    router.push(`/chat/${chat.id}?otherUserId=${chat.otherUserId}&otherUserName=${chat.otherUserName}`);
  };

  if (isGuest || !user) {
    return (
      <ScreenContainer>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: screenFadeAnim,
              transform: [{ translateY: screenSlideAnim }],
            },
          ]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Messages</Text>
            </View>
            <View style={styles.centerContainer}>
              <Card variant="base" style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="lock" size={48} color={colors.primary} />
                </View>
                <Text style={styles.emptyText}>Login Required</Text>
                <Text style={styles.emptySubtext}>
                  Sign in to access your messages and chat with property owners
                </Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.7}>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
              </Card>
            </View>
          </ScrollView>
        </Animated.View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: screenFadeAnim,
            transform: [{ translateY: screenSlideAnim }],
          },
        ]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>
                {chats.length > 0 ? `${chats.length} conversations` : 'Your conversations'}
              </Text>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.chatsList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <ChatCardSkeleton key={i} />
              ))}
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="message"
                title={error ? "Setting things up…" : "No messages yet"}
                message={error || "Start a conversation from a property listing or service request"}
                actionLabel={error ? "Retry" : undefined}
                onAction={error ? () => {
                  setError(null);
                  setLoading(true);
                } : undefined}
                variant={error ? "error" : "default"}
              />
            </View>
          ) : (
            <View style={styles.chatsList}>
              {chats.map((chat) => {
                const hasUnread =
                  chat.lastMessage && !chat.lastMessage.read && chat.lastMessage.receiverId === user?.uid;
                const isRead = chat.lastMessage?.read || false;
                const myMessage = isMyMessage(chat.lastMessage, user?.uid);

                return (
                  <Card
                    key={chat.id}
                    variant="interactive"
                    onPress={() => handleChatPress(chat)}
                    style={[
                      styles.chatCard,
                      hasUnread && styles.unreadCard,
                    ]}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {chat.otherUserPhoto ? (
                        <Image source={{ uri: chat.otherUserPhoto }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {chat.otherUserName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {hasUnread && <View style={styles.unreadIndicator} />}
                    </View>

                    {/* Chat Info */}
                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeader}>
                        <Text style={[styles.chatParticipant, hasUnread && styles.unreadParticipant]} numberOfLines={1}>
                          {chat.otherUserName}
                        </Text>
                        {chat.lastMessageTime && (
                          <Text style={styles.timestamp}>
                            {formatTimestamp(chat.lastMessageTime)}
                          </Text>
                        )}
                      </View>
                      {chat.lastMessage && (
                        <View style={styles.messageRow}>
                          <Text
                            style={[
                              styles.lastMessage,
                              hasUnread && styles.unreadMessage,
                            ]}
                            numberOfLines={1}>
                            {chat.lastMessage.content}
                          </Text>
                          {myMessage && (
                            <MaterialIcons
                              name={isRead ? 'done-all' : 'done'}
                              size={16}
                              color={isRead ? colors.primary : colors.textSecondary}
                              style={styles.readIcon}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  centerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.sectionHeading,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  loginButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  emptyContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  chatsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  unreadCard: {
    backgroundColor: `${colors.primary}08`,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.sectionHeading,
    color: colors.white,
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chatParticipant: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  unreadParticipant: {
    color: colors.primary,
  },
  timestamp: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  lastMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '600',
  },
  readIcon: {
    marginLeft: spacing.xs / 2,
  },
});
