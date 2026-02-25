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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ContactMessage } from '../types';
import { isAdmin } from '../utils/accessControl';
import { User } from '../types';

/**
 * Contact Service
 * Handles contact form submissions and admin viewing
 */
export const contactService = {
  /**
   * Submit a contact form message
   * Public - anyone can submit
   */
  async submitContactMessage(
    data: Omit<ContactMessage, 'id' | 'read' | 'replied' | 'createdAt'>
  ): Promise<string> {
    try {
      if (__DEV__) {
        console.log('[ContactService] 📧 Submitting contact message', {
          email: data.email,
          subject: data.subject,
        });
      }

      const docRef = await addDoc(collection(db, 'contactMessages'), {
        ...data,
        read: false,
        replied: false,
        createdAt: serverTimestamp(),
      });

      if (__DEV__) {
        console.log('[ContactService] ✅ Contact message submitted', {
          messageId: docRef.id,
        });
      }

      return docRef.id;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: submitContactMessage failed:', error);
      throw new Error(error.message || 'Failed to submit message. Please try again.');
    }
  },

  /**
   * Get all contact messages (admin only)
   */
  async getAllContactMessages(user: User | null): Promise<ContactMessage[]> {
    try {
      if (!isAdmin(user)) {
        throw new Error('Access denied. Admin access required.');
      }

      const q = query(
        collection(db, 'contactMessages'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const messages: ContactMessage[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ContactMessage);
      });

      return messages;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getAllContactMessages failed:', error);
      throw new Error(error.message || 'Failed to fetch messages');
    }
  },

  /**
   * Get unread contact messages count (admin only)
   */
  async getUnreadCount(user: User | null): Promise<number> {
    try {
      if (!isAdmin(user)) {
        return 0;
      }

      const q = query(
        collection(db, 'contactMessages'),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: getUnreadCount failed:', error);
      return 0;
    }
  },

  /**
   * Mark message as read (admin only)
   */
  async markAsRead(messageId: string, user: User | null): Promise<void> {
    try {
      if (!isAdmin(user)) {
        throw new Error('Access denied. Admin access required.');
      }

      await updateDoc(doc(db, 'contactMessages', messageId), {
        read: true,
      });
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: markAsRead failed:', error);
      throw new Error(error.message || 'Failed to mark message as read');
    }
  },

  /**
   * Mark message as replied (admin only)
   */
  async markAsReplied(messageId: string, user: User | null): Promise<void> {
    try {
      if (!isAdmin(user)) {
        throw new Error('Access denied. Admin access required.');
      }

      await updateDoc(doc(db, 'contactMessages', messageId), {
        replied: true,
        read: true,
      });
    } catch (error: any) {
      console.error('🔥 FIRESTORE ERROR: markAsReplied failed:', error);
      throw new Error(error.message || 'Failed to mark message as replied');
    }
  },
};
