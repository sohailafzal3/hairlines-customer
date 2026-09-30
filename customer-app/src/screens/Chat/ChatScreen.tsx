import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { ChatApi } from '../../api';
import { useSocket } from '../../hooks';
import { Message, Messages } from '../../models';
import { useAuthStore } from '../../store';
import { SenderType } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Chat'>;
  route: RouteProp<HomeStackParamList, 'Chat'>;
};

const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { jobId, spName } = route.params;
  const { user } = useAuthStore();
  const { emit, on } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
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
          senderName: data.senderName || spName || 'Stylist',
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
  }, [jobId, on, spName]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res: any = await ChatApi.fetchThread(jobId, 0);
      const list =
        res?.messages ||
        res?.messageList ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: Message[] = list.map((item: any) => ({
          id: item._id || item.id || `msg-${Date.now()}-${Math.random()}`,
          body: item.message || item.body || '',
          senderId: item.senderId || item.spAccountId || item.driverAccountId || '',
          senderType: item.senderType ?? (item.senderUserType === 'sp' ? SenderType.sp : SenderType.user),
          receiverType: item.receiverType ?? SenderType.sp,
          jobId: item.jobId || jobId,
          senderName: item.senderName || (item.senderType === SenderType.user ? 'You' : spName || 'Stylist'),
          senderImageUrl: item.senderImage || item.senderImageUrl || '',
          isRead: item.isRead ?? false,
          createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
          updatedAt: item.updatedAt ? String(item.updatedAt) : new Date().toISOString(),
          createdAtString: item.createdAtString || item.timePassed || 'Now',
          userId: item.userId || item.driverAccountId || '',
        }));
        setMessages(mapped.reverse());
      }
    } catch (e) {
      console.log('Error loading messages:', e);
    } finally {
      setLoading(false);
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
      senderName: user ? `${user.firstName} ${user.lastName}` : 'Customer',
      senderImageUrl: user?.profileImage,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAtString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userId: user?.id || '',
    };

    setMessages((prev) => [tempMessage, ...prev]);

    try {
      await ChatApi.sendMessage({
        jobId,
        body: text,
        receiverType: SenderType.sp,
      });

      emit('sendMessage', {
        jobId,
        body: text,
        senderUserId: user?.id,
        senderUserType: 'user',
        receiverUserType: 'sp',
      });
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  }, [inputText, jobId, user, emit]);

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.senderType === SenderType.user;
    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : item.createdAtString || '';

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextRight : styles.bubbleTextLeft]}>
            {item.body}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeRight : styles.bubbleTimeLeft]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TitleColor} />
        </TouchableOpacity>

        <View style={styles.headerProfileRow}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerName}>{spName || 'Stylist'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Live Booking Chat</Text>
            </View>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={Colors.ButtonPrimaryColor} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Start a Conversation</Text>
                <Text style={styles.emptySub}>
                  Coordinate details, confirm appointment time, or share reference photos with your stylist.
                </Text>
              </View>
            }
          />
        )}

        {/* Bottom Input Row */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
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
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 15,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: FontWeights.medium,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: Spacing.base,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubbleWrapperRight: {
    alignSelf: 'flex-end',
  },
  bubbleWrapperLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleRight: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderBottomRightRadius: 2,
  },
  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextRight: {
    color: '#FFFFFF',
  },
  bubbleTextLeft: {
    color: Colors.TitleColor,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  bubbleTimeRight: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  bubbleTimeLeft: {
    color: '#94A3B8',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.TitleColor,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 30,
    transform: [{ scaleY: -1 }],
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ChatScreen;
