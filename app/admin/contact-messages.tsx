import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radius, shadows, typography } from '../../src/theme';
import { contactService } from '../../src/services/contactService';
import { ContactMessage } from '../../src/types';
import { isAdmin } from '../../src/utils/accessControl';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

export default function ContactMessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && isAdmin(user)) {
      loadMessages();
    } else {
      Alert.alert('Access Denied', 'Admin access required', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user || !isAdmin(user)) return;

    try {
      setLoading(true);
      const data = await contactService.getAllContactMessages(user);
      setMessages(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading contact messages:', error);
      }
      Alert.alert('Error', error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (!user || !isAdmin(user)) return;

    try {
      await contactService.markAsRead(messageId, user);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  const handleMarkAsReplied = async (messageId: string) => {
    if (!user || !isAdmin(user)) return;

    try {
      await contactService.markAsReplied(messageId, user);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, replied: true, read: true } : msg
        )
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to mark as replied');
    }
  };

  if (!user || !isAdmin(user)) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.messageCardSkeleton}>
                <SkeletonLoader width="70%" height={20} style={{ marginBottom: spacing.xs }} />
                <SkeletonLoader width="50%" height={16} style={{ marginBottom: spacing.sm }} />
                <SkeletonLoader width="100%" height={60} />
              </View>
            ))}
          </View>
        ) : messages.length === 0 ? (
          <EmptyState
            icon="message"
            title="No Messages"
            message="No contact messages yet"
          />
        ) : (
          messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index * 50).duration(400)}>
              <View style={[styles.messageCard, !message.read && styles.unreadCard]}>
                <View style={styles.messageHeader}>
                  <View style={styles.messageInfo}>
                    <Text style={styles.messageName} numberOfLines={1}>
                      {message.name}
                    </Text>
                    <Text style={styles.messageEmail} numberOfLines={1}>
                      {message.email}
                    </Text>
                  </View>
                  <View style={styles.messageBadges}>
                    {!message.read && <View style={styles.unreadBadge} />}
                    {message.replied && (
                      <MaterialIcons name="check-circle" size={20} color={colors.success} />
                    )}
                  </View>
                </View>

                <Text style={styles.messageSubject} numberOfLines={1}>
                  {message.subject}
                </Text>
                <Text style={styles.messageText} numberOfLines={4}>
                  {message.message}
                </Text>

                {message.phoneNumber && (
                  <View style={styles.phoneRow}>
                    <MaterialIcons name="phone" size={16} color={colors.textSecondary} />
                    <Text style={styles.phoneText}>{message.phoneNumber}</Text>
                  </View>
                )}

                <Text style={styles.messageDate}>
                  {message.createdAt.toLocaleDateString()} at {message.createdAt.toLocaleTimeString()}
                </Text>

                <View style={styles.messageActions}>
                  {!message.read && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsRead(message.id)}
                      activeOpacity={0.7}>
                      <MaterialIcons name="mark-email-read" size={18} color={colors.primary} />
                      <Text style={styles.actionButtonText}>Mark Read</Text>
                    </TouchableOpacity>
                  )}
                  {!message.replied && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsReplied(message.id)}
                      activeOpacity={0.7}>
                      <MaterialIcons name="reply" size={18} color={colors.success} />
                      <Text style={styles.actionButtonText}>Mark Replied</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    ...typography.title,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.base,
  },
  skeletonContainer: {
    gap: spacing.md,
  },
  messageCardSkeleton: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  messageCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  messageInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  messageName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  messageEmail: {
    ...typography.small,
    color: colors.textSecondary,
  },
  messageBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  messageSubject: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  messageText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginBottom: spacing.xs,
  },
  phoneText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  messageDate: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  messageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionButtonText: {
    ...typography.small,
    color: colors.text,
  },
});
