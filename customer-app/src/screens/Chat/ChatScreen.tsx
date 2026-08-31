import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { ChatApi } from '../../api';
import { useApi, useSocket } from '../../hooks';
import { Message, Messages } from '../../models';
import { useAuthStore } from '../../store';
import { SenderType } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Chat'>;
  route: RouteProp<HomeStackParamList, 'Chat'>;
};

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, spName } = route.params || {};
  const { user } = useAuthStore();
  const { emit, on } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const {
    data: threadData,
    loading,
    execute: fetchThread,
  } = useApi<Messages>(ChatApi.fetchThread);

  useEffect(() => {
    if (jobId) {
      loadMessages();
    }
  }, [jobId]);

  useEffect(() => {
    const unsubscribe = on('messageSendingToReceiverKey', (data: any) => {
      if (data?.jobId === jobId) {
        const newMessage: Message = {
          id: Date.now().toString(),
          body: data.body,
          senderId: data.senderUserId,
          senderType: data.senderUserType === 'user' ? SenderType.user : SenderType.sp,
          receiverType: data.receiverUserType === 'user' ? SenderType.user : SenderType.sp,
          jobId: data.jobId,
          senderName: data.senderName || 'Service Provider',
          senderImageUrl: data.senderImageUrl,
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAtString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          userId: data.senderUserId,
        };
        setMessages((prev) => [newMessage, ...prev]);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [jobId, on]);

  const loadMessages = async () => {
    const result = await fetchThread(jobId, 0);
    if (result?.messages) {
      setMessages(result.messages.reverse());
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      body: text,
      senderId: user?.id || '',
      senderType: SenderType.user,
      receiverType: SenderType.sp,
      jobId,
      senderName: user?.name || 'You',
      senderImageUrl: user?.profileImage,
      isRead: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAtString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userId: user?.id || '',
    };
    setMessages((prev) => [tempMessage, ...prev]);

    emit('messageSendingKey', {
      body: text,
      jobId,
      senderUserType: 'user',
      receiverUserType: 'sp',
      senderUserId: user?.id,
    });

    setSending(false);
  }, [inputText, jobId, user, emit]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOutgoing = item.senderType === SenderType.user;

    return (
      <View style={[styles.messageContainer, isOutgoing ? styles.outgoing : styles.incoming]}>
        {!isOutgoing && (
          item.senderImageUrl ? (
            <Image source={{ uri: item.senderImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.senderName?.charAt(0) || 'S'}</Text>
            </View>
          )
        )}

        <View style={[styles.bubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
          <Text style={[styles.messageText, isOutgoing ? styles.textOutgoing : styles.textIncoming]}>
            {item.body}
          </Text>
          <Text style={[styles.timeText, isOutgoing ? styles.timeOutgoing : styles.timeIncoming]}>
            {item.createdAtString || ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{spName || 'Barber Chat'}</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubtitle}>Booking #{jobId ? jobId.slice(-6) : ''}</Text>
          </View>
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        inverted
      />

      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <VTLoading visible={loading && messages.length === 0} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  messagesContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  incoming: {
    alignSelf: 'flex-start',
  },
  outgoing: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  avatarText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  bubble: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md - 2,
    maxWidth: '100%',
  },
  bubbleIncoming: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleOutgoing: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    lineHeight: 20,
  },
  textIncoming: {
    color: '#0F172A',
  },
  textOutgoing: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeIncoming: {
    color: '#94A3B8',
  },
  timeOutgoing: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#0F172A',
    maxHeight: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
});

export default ChatScreen;
