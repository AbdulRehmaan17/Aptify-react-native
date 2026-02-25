import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { Chat, Message } from '../types';
import { AppStackParamList } from '../navigation/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

type ChatWithUser = Chat & {
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
};

type ChatListScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function ChatListScreen() {
  const { user, loading: authLoading } = useAuth();
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user?.uid) {
      setLoading(false);
      setChats([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const unsubscribe = chatService.subscribeToUserChats(user.uid, async (updatedChats) => {
        try {
          const chatsWithUserInfo = await Promise.all(
            updatedChats.map(async (chat) => {
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

          setChats(chatsWithUserInfo);
          setError(null);
        } catch (error: any) {
          if (__DEV__) {
            console.error('[ChatListScreen] ❌ Error processing chats:', error);
          }
          setError(error.message || 'Failed to process chats.');
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      });

      return () => {
        unsubscribe();
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('[ChatListScreen] ❌ Error setting up subscription:', error);
      }
      setError(error.message || 'Failed to load chats. Please try again.');
      setLoading(false);
    }
  }, [user, authLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    // The subscription will automatically update when data changes
    // Just trigger a refresh state, the listener will handle the update
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
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    // Show date if older than a week
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleChatPress = (chat: ChatWithUser) => {
    navigation.navigate('ChatDetail', {
      id: chat.id,
      otherUserId: chat.otherUserId,
      otherUserName: chat.otherUserName,
    });
  };

  if (!user && !authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Please sign in to view your messages.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading && chats.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Loading chats...
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error || '#FF3B30'} />
            <Text variant="title" style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => {}}
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
            >
              <Text variant="body" style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={{ backgroundColor: colors.card }}>
          <Text variant="title" style={[styles.headerTitle, { color: colors.text }]}>
            Messages
          </Text>
          <Text variant="muted" style={styles.headerSubtitle}>
            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
          </Text>
        </Card>

        {chats.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="message" size={64} color={colors.text} />
            <Text variant="title" style={[styles.emptyTitle, { color: colors.text }]}>
              No Messages
            </Text>
            <Text variant="muted" style={styles.emptySubtitle}>
              Start a conversation from a property listing or service request
            </Text>
          </View>
        ) : (
          chats.map((chat) => {
            const hasUnread =
              chat.lastMessage &&
              !chat.lastMessage.read &&
              chat.lastMessage.receiverId === user?.uid;

            return (
              <TouchableOpacity
                key={chat.id}
                onPress={() => handleChatPress(chat)}
                activeOpacity={0.7}
              >
                <Card style={{ backgroundColor: colors.card }}>
                  <View style={styles.chatContent}>
                    {/* Avatar */}
                    {chat.otherUserPhoto ? (
                      <Image source={{ uri: chat.otherUserPhoto }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint }]}>
                        <Text variant="body" style={styles.avatarText}>
                          {chat.otherUserName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Chat Info */}
                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeader}>
                        <Text variant="body" style={[styles.chatParticipant, { color: colors.text }]} numberOfLines={1}>
                          {chat.otherUserName}
                        </Text>
                        {chat.lastMessageTime && (
                          <Text variant="muted" style={styles.timestamp}>
                            {formatTimestamp(chat.lastMessageTime)}
                          </Text>
                        )}
                      </View>
                      {chat.lastMessage && (
                        <View style={styles.messageRow}>
                          <Text
                            variant={hasUnread ? 'body' : 'muted'}
                            style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
                            numberOfLines={1}
                          >
                            {chat.lastMessage.content}
                          </Text>
                          {hasUnread && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
                              <Text variant="body" style={styles.unreadBadgeText}>
                                !
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {!chat.lastMessage && (
                        <Text variant="muted" style={styles.noMessages}>
                          No messages yet
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    marginTop: 4,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  chatParticipant: {
    flex: 1,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  noMessages: {
    fontStyle: 'italic',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

