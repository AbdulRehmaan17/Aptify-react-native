import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, User } from '../types';
import { requireAuth } from '../utils/accessControl';

/**
 * Notification Service
 * Handles all notification-related operations
 */
export const notificationService = {
  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: Notification['type'],
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        body,
        type,
        data: data || {},
        read: false,
        createdAt: serverTimestamp(),
      });

      return notificationRef.id;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: createNotification failed:', error);
      throw new Error(error.message || 'Failed to create notification');
    }
  },

  /**
   * Get notifications for a user
   * Ownership: Users can only see their own notifications
   */
  async getUserNotifications(userId: string, user: User | null, limitCount: number = 50): Promise<Notification[]> {
    try {
      // Users can only query their own notifications
      if (user?.uid !== userId) {
        throw new Error('Access denied. You can only view your own notifications.');
      }

      let q;
      try {
        q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } catch (error) {
        // Fallback if index doesn't exist - order in memory
        q = query(collection(db, 'notifications'), where('userId', '==', userId));
      }

      const snapshot = await getDocs(q);
      
      const notifications: Notification[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push({
          id: docSnap.id,
          userId: data.userId,
          title: data.title,
          body: data.body,
          type: data.type,
          data: data.data,
          read: data.read,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification);
      });

      // Sort by createdAt if not using orderBy (fallback)
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply limit if not using Firestore limit
      return notifications.slice(0, limitCount);
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getUserNotifications failed:', error);
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  },

  /**
   * Get unread notifications count
   * Ownership: Users can only see their own notification count
   */
  async getUnreadCount(userId: string, user: User | null): Promise<number> {
    try {
      // Users can only query their own notification count
      if (user?.uid !== userId) {
        throw new Error('Access denied. You can only view your own notification count.');
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getUnreadCount failed:', error);
      throw new Error(error.message || 'Failed to get unread count');
    }
  },

  /**
   * Mark notification as read
   * Ownership: Users can only mark their own notifications as read
   */
  async markAsRead(notificationId: string, user: User): Promise<void> {
    try {
      requireAuth(user);

      // Verify notification belongs to user
      const notificationDoc = await getDoc(doc(db, 'notifications', notificationId));
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const notification = notificationDoc.data() as Notification;
      if (notification.userId !== user.uid) {
        throw new Error('Access denied. You can only mark your own notifications as read.');
      }

      // Security rules require: userId cannot change
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        userId: notification.userId, // Preserve userId (security rule requirement)
      });
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: markAsRead failed:', error);
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read
   * Ownership: Users can only mark their own notifications as read
   */
  async markAllAsRead(userId: string, user: User): Promise<void> {
    try {
      requireAuth(user);
      
      // Verify user is marking their own notifications
      if (user.uid !== userId) {
        throw new Error('Access denied. You can only mark your own notifications as read.');
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((docSnap) =>
        updateDoc(docSnap.ref, { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: markAllAsRead failed:', error);
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  },

  /**
   * Delete a notification
   * Ownership: Users can only delete their own notifications
   */
  async deleteNotification(notificationId: string, user: User): Promise<void> {
    try {
      requireAuth(user);

      // Verify notification belongs to user
      const notificationDoc = await getDoc(doc(db, 'notifications', notificationId));
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const notification = notificationDoc.data() as Notification;
      if (notification.userId !== user.uid) {
        throw new Error('Access denied. You can only delete your own notifications.');
      }

      // Security rules require: userId cannot change
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true, // Soft delete by marking as read
        userId: notification.userId, // Preserve userId (security rule requirement)
      });
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: deleteNotification failed:', error);
      throw new Error(error.message || 'Failed to delete notification');
    }
  },

  /**
   * Subscribe to user notifications (real-time updates)
   * Ownership: Users can only subscribe to their own notifications
   */
  subscribeToUserNotifications(
    userId: string,
    user: User | null,
    callback: (notifications: Notification[]) => void
  ): () => void {
    // Verify user is subscribing to their own notifications
    if (user?.uid !== userId) {
      console.error('Access denied. Users can only subscribe to their own notifications.');
      return () => {}; // Return no-op unsubscribe function
    }
    let q;
    try {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } catch (error) {
      // Fallback if index doesn't exist - order in memory
      q = query(collection(db, 'notifications'), where('userId', '==', userId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notifications.push({
            id: docSnap.id,
            userId: data.userId,
            title: data.title,
            body: data.body,
            type: data.type,
            data: data.data,
            read: data.read,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Notification);
        });

        // Sort by createdAt if not using orderBy (fallback)
        notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Apply limit if not using Firestore limit
        callback(notifications.slice(0, 50));
      },
      (error) => {
        console.error('Error in notification subscription:', error);
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to unread count (real-time updates)
   * Ownership: Users can only subscribe to their own unread count
   */
  subscribeToUnreadCount(userId: string, user: User | null, callback: (count: number) => void): () => void {
    // Verify user is subscribing to their own unread count
    if (user?.uid !== userId) {
      console.error('Access denied. Users can only subscribe to their own unread count.');
      return () => {}; // Return no-op unsubscribe function
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.size);
      },
      (error) => {
        console.error('Error in unread count subscription:', error);
        callback(0);
      }
    );

    return unsubscribe;
  },
};

