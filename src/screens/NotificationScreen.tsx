import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NotificationScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for notifications
    const unsubscribeNotifications = notificationService.subscribeToUserNotifications(
      user.uid,
      (updatedNotifications) => {
        // Ensure time-based sorting (newest first)
        const sorted = updatedNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(sorted);
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Set up real-time listener for unread count
    const unsubscribeUnreadCount = notificationService.subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    // Real-time listeners will automatically update
    // This just triggers a refresh indicator
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read || markingAsRead === notification.id) return;

    try {
      setMarkingAsRead(notification.id);
      await notificationService.markAsRead(notification.id);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationService.markAllAsRead(user.uid);
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

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

    // Show full date if older than a week
    return notificationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type: Notification['type']): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'message':
        return 'message';
      case 'property':
        return 'home';
      case 'service':
        return 'build';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: Notification['type']): string => {
    switch (type) {
      case 'message':
        return '#0a7ea4';
      case 'property':
        return '#34C759';
      case 'service':
        return '#FF9500';
      case 'system':
        return '#AF52DE';
      default:
        return colors.icon;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-off" size={64} color={colors.text} />
            <Text variant="body" style={[styles.emptyText, { color: colors.text }]}>
              Please sign in to view notifications
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Card style={{ backgroundColor: colors.card }}>
          <View style={styles.headerContent}>
            <Text variant="title" style={[styles.headerTitle, { color: colors.text }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={[styles.markAllButton, { backgroundColor: colors.primary }]}
              >
                <Text variant="body" style={styles.markAllButtonText}>
                  Mark all as read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color={colors.text} />
            <Text variant="title" style={[styles.emptyText, { color: colors.text }]}>
              No notifications
            </Text>
            <Text variant="muted" style={styles.emptySubtext}>
              You're all caught up!
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const iconColor = getNotificationColor(notification.type);
            const iconName = getNotificationIcon(notification.type);

            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleMarkAsRead(notification)}
                activeOpacity={0.7}
              >
                <Card
                  style={{
                    backgroundColor: notification.read ? colors.card : colors.background,
                    borderLeftWidth: notification.read ? 0 : 4,
                    borderLeftColor: colors.primary,
                  }}
                >
                  <View style={styles.notificationContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                      <MaterialIcons name={iconName} size={24} color={iconColor} />
                    </View>

                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Text variant="body" style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <Text variant="muted" style={styles.notificationBody} numberOfLines={2}>
                        {notification.body}
                      </Text>
                      <View style={styles.notificationFooter}>
                        <Text variant="muted" style={styles.timestamp}>
                          {formatTimestamp(notification.createdAt)}
                        </Text>
                        <Text variant="muted" style={[styles.typeLabel, { color: iconColor }]}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {markingAsRead === notification.id && (
                      <View style={styles.markingIndicator}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
    minHeight: 400,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  markingIndicator: {
    justifyContent: 'center',
    paddingLeft: 4,
  },
});
