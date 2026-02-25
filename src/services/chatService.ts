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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message, Chat, User } from '../types';
import { notificationService } from './notificationService';
import { isChatParticipant, requireAuth } from '../utils/accessControl';
import { isFirestoreIndexError } from '../utils/firestoreSafe';

/**
 * Chat Service
 * Handles all chat and messaging operations
 */
export const chatService = {
  /**
   * Get or create a chat between two users
   * Ownership: User must be one of the participants
   */
  async getOrCreateChat(userId1: string, userId2: string, user: User): Promise<string> {
    try {
      requireAuth(user);
      
      // Verify user is one of the participants
      if (user.uid !== userId1 && user.uid !== userId2) {
        throw new Error('Access denied. You can only create chats with yourself as a participant.');
      }

      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId1)
      );

      const snapshot = await getDocs(q);
      let existingChatId: string | null = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.participants.includes(userId1) &&
          data.participants.includes(userId2) &&
          data.participants.length === 2
        ) {
          existingChatId = docSnap.id;
        }
      });

      if (existingChatId) {
        return existingChatId;
      }

      // Create new chat
      // Ensure participants is an array of strings (security rule requirement)
      const participants: string[] = [userId1, userId2].filter(
        (id) => typeof id === 'string' && id.trim().length > 0
      );

      if (participants.length < 2) {
        throw new Error('Chat must have at least 2 participants');
      }

      // Ensure current user is in participants (security rule requirement)
      if (!participants.includes(user.uid)) {
        throw new Error('You must be a participant in the chat');
      }

      const chatRef = await addDoc(collection(db, 'chats'), {
        participants, // Array of strings - matches security rule
        createdAt: serverTimestamp(), // Timestamp - matches security rule
      });

      if (__DEV__) {
        console.log('[ChatService] ✅ Chat created');
      }

      return chatRef.id;
    } catch (error: any) {
      console.warn('🔥 FIRESTORE WARNING: getOrCreateChat failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to get or create chat');
    }
  },

  /**
   * Get all chats for a user
   * Ownership: Users can only see their own chats
   */
  async getUserChats(userId: string, user: User | null): Promise<Chat[]> {
    try {
      // Users can only query their own chats
      if (user?.uid !== userId) {
        throw new Error('Access denied. You can only view your own chats.');
      }

      let q;
      try {
        // Try query with orderBy (requires composite index)
        q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', userId),
          orderBy('lastMessageTime', 'desc')
        );
      } catch (error: any) {
        // Fallback if index doesn't exist - order in memory
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId)
          );
        } else {
          throw error;
        }
      }

      const snapshot = await getDocs(q);
      const chats: Chat[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Validate participants is an array (security rule requirement)
        if (!Array.isArray(data.participants)) {
          if (__DEV__) {
            console.warn('[ChatService] ⚠️ Invalid chat data: participants is not an array', {
              chatId: docSnap.id,
            });
          }
          return; // Skip invalid chat
        }

        // Ensure user is in participants (double-check, query should already filter)
        if (!data.participants.includes(userId)) {
          if (__DEV__) {
            console.warn('[ChatService] ⚠️ Chat does not include user in participants', {
              chatId: docSnap.id,
              userId,
              participants: data.participants,
            });
          }
          return; // Skip chat user doesn't participate in
        }

        chats.push({
          id: docSnap.id,
          participants: data.participants, // Array of strings
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Chat);
      });

      // Sort in memory if orderBy wasn't used (index missing)
      // Check if query has orderBy constraint
      const hasOrderBy = (q as any)._queryConstraints?.some((c: any) => c.type === 'orderBy');
      if (!hasOrderBy) {
        chats.sort((a, b) => {
          const timeA = a.lastMessageTime?.getTime() || 0;
          const timeB = b.lastMessageTime?.getTime() || 0;
          return timeB - timeA; // Descending order
        });
      }

      return chats;
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ChatService] ⚠️ Missing Firestore index for getUserChats. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getUserChats failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch chats');
    }
  },

  /**
   * Send a message
   * Ownership: Sender must be a participant in the chat
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    receiverId: string,
    content: string,
    user: User
  ): Promise<string> {
    try {
      requireAuth(user);
      
      // Verify sender is the authenticated user
      if (user.uid !== senderId) {
        throw new Error('Access denied. You can only send messages as yourself.');
      }

      // Verify user is a participant in the chat
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chat = chatDoc.data() as Chat;
      if (!isChatParticipant(user, chat.participants)) {
        throw new Error('Access denied. You are not a participant in this chat.');
      }

      // Add message to messages collection
      const messageRef = await addDoc(collection(db, 'messages'), {
        chatId,
        senderId,
        receiverId,
        content,
        read: false,
        timestamp: serverTimestamp(),
      });

      // Update chat's last message
      // Security rules require: participants cannot change
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          id: messageRef.id,
          chatId,
          senderId,
          receiverId,
          content,
          read: false,
          timestamp: serverTimestamp(),
        },
        lastMessageTime: serverTimestamp(),
        participants: chat.participants, // Preserve participants (security rule requirement)
      });

      // Create notification for receiver
      try {
        // Get sender info for notification
        let senderName = 'Someone';
        try {
          const senderDoc = await getDoc(doc(db, 'users', senderId));
          if (senderDoc.exists()) {
            const senderData = senderDoc.data();
            // Map Firestore 'name' to mobile 'displayName' (same as web app)
            senderName = senderData.name || senderData.displayName || senderData.email || 'Someone';
          }
        } catch (error) {
          // If we can't get sender info, use default name
          console.warn('Failed to get sender info for notification:', error);
        }
        
        // Truncate message content for notification
        const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
        
        await notificationService.createNotification(
          receiverId,
          'New Message',
          `${senderName}: ${messagePreview}`,
          'message',
          { chatId, messageId: messageRef.id, senderId }
        );
      } catch (error) {
        // Don't throw error for notification failures
        console.warn('Failed to create notification for new message:', error);
      }

      return messageRef.id;
    } catch (error: any) {
      console.warn('🔥 FIRESTORE WARNING: sendMessage failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to send message');
    }
  },

  /**
   * Get messages for a chat
   * Ownership: User must be a participant in the chat
   */
  async getChatMessages(chatId: string, user: User, limitCount: number = 50): Promise<Message[]> {
    try {
      requireAuth(user);

      // Verify user is a participant in the chat
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chat = chatDoc.data() as Chat;
      if (!isChatParticipant(user, chat.participants)) {
        throw new Error('Access denied. You are not a participant in this chat.');
      }

      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages: Message[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          chatId: data.chatId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          read: data.read,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Message);
      });

      return messages.reverse(); // Reverse to show oldest first
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ChatService] ⚠️ Missing Firestore index for getChatMessages. Returning empty list.', {
          code: error?.code,
          message: error?.message,
        });
        return [];
      }

      console.warn('🔥 FIRESTORE WARNING: getChatMessages failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to fetch messages');
    }
  },

  /**
   * Mark messages as read
   * Ownership: User must be the receiver
   */
  async markMessagesAsRead(chatId: string, userId: string, user: User): Promise<void> {
    try {
      requireAuth(user);
      
      // Verify user is marking their own messages as read
      if (user.uid !== userId) {
        throw new Error('Access denied. You can only mark your own messages as read.');
      }

      // Verify user is a participant in the chat
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const chat = chatDoc.data() as Chat;
        if (!isChatParticipant(user, chat.participants)) {
          throw new Error('Access denied. You are not a participant in this chat.');
        }
      }

      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((docSnap) => {
        // Security rules require: senderId, receiverId, chatId cannot change
        const messageData = docSnap.data();
        return updateDoc(docSnap.ref, {
          read: true,
          senderId: messageData.senderId, // Preserve senderId (security rule requirement)
          receiverId: messageData.receiverId, // Preserve receiverId (security rule requirement)
          chatId: messageData.chatId, // Preserve chatId (security rule requirement)
        });
      });

      await Promise.all(updatePromises);
    } catch (error: any) {
      if (isFirestoreIndexError(error)) {
        console.warn('[ChatService] ⚠️ Missing Firestore index for markMessagesAsRead. Skipping update.', {
          code: error?.code,
          message: error?.message,
        });
        return;
      }

      console.warn('🔥 FIRESTORE WARNING: markMessagesAsRead failed:', {
        code: error?.code,
        message: error?.message,
      });
      throw new Error(error.message || 'Failed to mark messages as read');
    }
  },

  /**
   * Subscribe to chat messages (real-time updates)
   * Ownership: User must be a participant (caller should verify access before subscribing)
   * 
   * NOTE: For security, verify user is a participant using getChatMessages() or 
   * check chat access in the calling component before subscribing.
   */
  subscribeToChatMessages(
    chatId: string,
    user: User,
    callback: (messages: Message[]) => void
  ): () => void {
    // Note: Access verification should be done before calling this method
    // Real-time subscriptions cannot be easily verified synchronously
    // The caller should verify access using getChatMessages() first
    
    // TEMPORARILY DISABLED: Real-time listener commented out to prevent permission crashes
    // const q = query(
    //   collection(db, 'messages'),
    //   where('chatId', '==', chatId),
    //   orderBy('timestamp', 'asc')
    // );

    // const unsubscribe = onSnapshot(
    //   q,
    //   (snapshot) => {
    //     const messages: Message[] = [];
    //     snapshot.forEach((docSnap) => {
    //       const data = docSnap.data();
    //       messages.push({
    //         id: docSnap.id,
    //         chatId: data.chatId,
    //         senderId: data.senderId,
    //         receiverId: data.receiverId,
    //         content: data.content,
    //         read: data.read,
    //         timestamp: data.timestamp?.toDate() || new Date(),
    //       } as Message);
    //     });
    //     callback(messages);
    //   },
    //   (error) => {
    //     console.error('Error in chat messages subscription:', error);
    //     callback([]);
    //   }
    // );

    // Return empty array instead of real-time updates
    callback([]);
    return () => {}; // No-op unsubscribe function
  },

  /**
   * Subscribe to user chats (real-time updates)
   * Ownership: Users can only subscribe to their own chats
   */
  subscribeToUserChats(
    userId: string,
    user: User | null,
    callback: (chats: Chat[]) => void
  ): () => void {
    // Verify user is subscribing to their own chats
    if (!user || user.uid !== userId) {
      console.warn('🔥 FIRESTORE WARNING: Access denied. Users can only subscribe to their own chats.');
      callback([]);
      return () => {}; // Return no-op unsubscribe function
    }
    
    if (__DEV__) {
      console.log('[ChatService] 🔍 Starting subscribeToUserChats');
    }
    let q;
    try {
      // Try query with orderBy (requires composite index)
      q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );
    } catch (error: any) {
      // Fallback if index doesn't exist - order in memory
      if (isFirestoreIndexError(error)) {
        console.warn('[ChatService] ⚠️ Firestore index missing, falling back to in-memory sorting', {
          code: error?.code,
          message: error?.message,
        });
        q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', userId)
        );
      } else {
        console.warn('🔥 FIRESTORE WARNING: Failed to create chat query:', {
          code: error?.code,
          message: error?.message,
        });
        callback([]);
        return () => {};
      }
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (__DEV__) {
          console.log('[ChatService] 📨 Snapshot received');
        }
        const chats: Chat[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          
          // Validate participants is an array (security rule requirement)
          if (!Array.isArray(data.participants)) {
            if (__DEV__) {
              console.warn('[ChatService] ⚠️ Invalid chat data: participants is not an array (subscription)', {
                chatId: docSnap.id,
              });
            }
            return; // Skip invalid chat
          }

          // Ensure user is in participants (double-check, query should already filter)
          if (!data.participants.includes(userId)) {
            if (__DEV__) {
              console.warn('[ChatService] ⚠️ Chat does not include user in participants (subscription)', {
                chatId: docSnap.id,
                userId,
              });
            }
            return; // Skip chat user doesn't participate in
          }

          chats.push({
            id: docSnap.id,
            participants: data.participants, // Array of strings - validated
            lastMessage: data.lastMessage
              ? {
                  id: data.lastMessage.id,
                  chatId: data.lastMessage.chatId,
                  senderId: data.lastMessage.senderId,
                  receiverId: data.lastMessage.receiverId,
                  content: data.lastMessage.content,
                  read: data.lastMessage.read,
                  timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                }
              : undefined,
            lastMessageTime: data.lastMessageTime?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Chat);
        });

        // Sort by lastMessageTime if not using orderBy
        chats.sort((a, b) => {
          const timeA = a.lastMessageTime?.getTime() || 0;
          const timeB = b.lastMessageTime?.getTime() || 0;
          return timeB - timeA;
        });

        if (__DEV__) {
          console.log('[ChatService] ✅ Processed chats');
        }
        callback(chats);
      },
      (error) => {
        if (isFirestoreIndexError(error)) {
          console.warn('[ChatService] ⚠️ Missing Firestore index in subscribeToUserChats. Returning empty list.', {
            code: error?.code,
            message: error?.message,
          });
          callback([]);
          return;
        }

        console.warn('🔥 FIRESTORE WARNING: Chat subscription failed:', {
          code: error?.code,
          message: error?.message,
        });
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Get user information by ID
   */
  async getUserInfo(userId: string): Promise<{ displayName?: string; email: string; photoURL?: string } | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Map Firestore 'name' to mobile 'displayName' (same as web app)
        return {
          displayName: data.name || data.displayName,
          email: data.email || '',
          photoURL: data.photoURL,
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      return null;
    }
  },

  /**
   * Set typing indicator for a user in a chat
   * Ownership: User must be a participant
   */
  async setTyping(chatId: string, userId: string, isTyping: boolean, user: User): Promise<void> {
    try {
      requireAuth(user);
      
      // Verify user is setting their own typing status
      if (user.uid !== userId) {
        throw new Error('Access denied. You can only set your own typing status.');
      }

      // Verify user is a participant in the chat
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }
      
      const chat = chatDoc.data() as Chat;
      if (!isChatParticipant(user, chat.participants)) {
        throw new Error('Access denied. You are not a participant in this chat.');
      }

      // Security rules require: participants cannot change
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`typing.${userId}`]: isTyping ? serverTimestamp() : null,
        participants: chat.participants, // Preserve participants (security rule requirement)
      });
    } catch (error: any) {
      // Don't throw error for typing indicator failures, just log
      console.warn('Error setting typing indicator:', {
        code: error?.code,
        message: error?.message,
      });
    }
  },

  /**
   * Subscribe to typing indicators for a chat
   */
  subscribeToTyping(
    chatId: string,
    callback: (typingUsers: Record<string, Date>) => void
  ): () => void {
    // TEMPORARILY DISABLED: Real-time listener commented out to prevent permission crashes
    // const chatRef = doc(db, 'chats', chatId);
    
    // const unsubscribe = onSnapshot(chatRef, (docSnap) => {
    //   if (docSnap.exists()) {
    //     const data = docSnap.data();
    //     const typing = data.typing || {};
    //     const typingUsers: Record<string, Date> = {};
        
    //     // Only include typing users (non-null values)
    //     Object.keys(typing).forEach((userId) => {
    //       const typingTime = typing[userId];
    //       if (typingTime) {
    //         // Consider typing as active if it was set within last 3 seconds
    //         const typingDate = typingTime.toDate ? typingTime.toDate() : new Date(typingTime);
    //         const now = new Date();
    //         const diffInSeconds = (now.getTime() - typingDate.getTime()) / 1000;
            
    //         if (diffInSeconds < 3) {
    //           typingUsers[userId] = typingDate;
    //         }
    //       }
    //     });
        
    //     callback(typingUsers);
    //   } else {
    //     callback({});
    //   }
    // });

    // Return empty object instead of real-time updates
    callback({});
    return () => {}; // No-op unsubscribe function
  },
};

