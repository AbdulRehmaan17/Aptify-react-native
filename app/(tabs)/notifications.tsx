import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { notificationService } from '../../src/services/notificationService';
import { Notification } from '../../src/types';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screen fade-in animation
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const screenSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let isMounted = true;
    
    // Screen entrance animation
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

    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribeNotifications = notificationService.subscribeToUserNotifications(
      user.uid,
      user,
      (updatedNotifications) => {
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        try {
          setError(null);
          const sorted = updatedNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setNotifications(sorted);
          setLoading(false);
          setRefreshing(false);
        } catch (error: any) {
          console.error('🔥 FIRESTORE ERROR: Failed to process notifications:', error);
          if (isMounted) {
            setError('Setting things up… This may take a moment.');
            setLoading(false);
            setRefreshing(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribeNotifications();
    };
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;

    try {
      await notificationService.markAsRead(notification.id);
    } catch (error) {
      if (__DEV__) {
        console.error('Error marking notification as read:', error);
      }
    }
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
        return colors.primary;
      case 'property':
        return colors.primary;
      case 'service':
        return colors.warning;
      case 'system':
        return colors.info;
      default:
        return colors.muted;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
            </View>

            {/* Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon="notifications-none"
                  title={error ? "Setting things up…" : "No notifications"}
                  message={error || "You're all caught up! New notifications will appear here"}
                  actionLabel={error ? "Retry" : undefined}
                  onAction={error ? () => {
                    setError(null);
                    setLoading(true);
                    // Subscription will retry automatically
                  } : undefined}
                  variant={error ? "error" : "default"}
                />
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => {
                  const iconColor = getNotificationColor(notification.type);
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationCard,
                        !notification.read && styles.unreadCard,
                      ]}
                      onPress={() => handleMarkAsRead(notification)}
                      activeOpacity={0.7}>
                      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                        <MaterialIcons
                          name={getNotificationIcon(notification.type)}
                          size={24}
                          color={iconColor}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle} numberOfLines={1}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={[styles.unreadDot, { backgroundColor: iconColor }]} />
                          )}
                        </View>
                        <Text style={styles.notificationBody} numberOfLines={2}>
                          {notification.body}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {notification.createdAt.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg * 3,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    marginTop: spacing.md,
  },
  notificationsList: {
    gap: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  notificationBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
