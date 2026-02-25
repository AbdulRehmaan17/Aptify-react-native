import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { chatService } from '../../src/services/chatService';
import { Message } from '../../src/types';
import { colors, spacing, radius, typography, shadows } from '../../src/theme';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';

export default function ChatDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; otherUserId?: string; otherUserName?: string }>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserName, setOtherUserName] = useState(params.otherUserName || 'User');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user || !params.id) {
      router.back();
      return;
    }

    // Load user info
    if (params.otherUserId) {
      chatService.getUserInfo(params.otherUserId).then((info) => {
        if (info?.displayName) {
          setOtherUserName(info.displayName);
        }
      });
    }

    // Load messages
    loadMessages();

    // Screen animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [params.id, user]);

  const loadMessages = async () => {
    if (!user || !params.id) return;
    
    try {
      const loadedMessages = await chatService.getChatMessages(params.id, user, 50);
      setMessages(loadedMessages);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user || !params.id || !params.otherUserId || sending) return;

    setSending(true);
    try {
      await chatService.sendMessage(
        params.id,
        user.uid,
        params.otherUserId,
        messageText.trim(),
        user
      );
      setMessageText('');
      await loadMessages();
    } catch (error: any) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isMyMessage = (senderId: string): boolean => {
    return senderId === user?.uid;
  };

  return (
    <ScreenContainer scrollable={false} padding={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUserName}
              </Text>
              <Text style={styles.headerStatus}>Online</Text>
            </View>
            <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
              <MaterialIcons name="more-vert" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}>
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="chat-bubble-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation</Text>
              </View>
            ) : (
              messages.map((message, index) => {
                const isMine = isMyMessage(message.senderId);
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageWrapper,
                      isMine ? styles.messageWrapperRight : styles.messageWrapperLeft,
                    ]}>
                    {!isMine && showAvatar && (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {otherUserName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {!isMine && !showAvatar && <View style={styles.avatarSpacer} />}
                    <View
                      style={[
                        styles.messageBubble,
                        isMine ? styles.messageBubbleRight : styles.messageBubbleLeft,
                      ]}>
                      <Text
                        style={[
                          styles.messageText,
                          isMine ? styles.messageTextRight : styles.messageTextLeft,
                        ]}>
                        {message.content}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isMine ? styles.messageTimeRight : styles.messageTimeLeft,
                        ]}>
                        {formatTime(message.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!messageText.trim() || sending}
                style={[
                  styles.sendButton,
                  (!messageText.trim() || sending) && styles.sendButtonDisabled,
                ]}
                activeOpacity={0.7}>
                <MaterialIcons
                  name="send"
                  size={24}
                  color={messageText.trim() && !sending ? colors.white : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  headerStatus: {
    ...typography.small,
    color: colors.textSecondary,
  },
  moreButton: {
    padding: spacing.xs,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    alignItems: 'flex-end',
  },
  messageWrapperLeft: {
    justifyContent: 'flex-start',
  },
  messageWrapperRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  avatarText: {
    ...typography.label,
    color: colors.white,
  },
  avatarSpacer: {
    width: 32,
    marginRight: spacing.xs,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  messageBubbleLeft: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.xs,
    ...shadows.sm,
  },
  messageBubbleRight: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.xs,
  },
  messageText: {
    ...typography.body,
    marginBottom: spacing.xs / 2,
  },
  messageTextLeft: {
    color: colors.text,
  },
  messageTextRight: {
    color: colors.white,
  },
  messageTime: {
    ...typography.small,
    fontSize: 10,
  },
  messageTimeLeft: {
    color: colors.textSecondary,
  },
  messageTimeRight: {
    color: colors.white,
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
