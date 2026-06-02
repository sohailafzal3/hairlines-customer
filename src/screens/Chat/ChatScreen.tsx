import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
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
  const { jobId, spName } = route.params;
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
          senderName: data.senderName || 'Service Provider',
          senderImageUrl: data.senderImageUrl,
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAtString: new Date().toLocaleString(),
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

    // Optimistic update
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
      createdAtString: new Date().toLocaleString(),
      userId: user?.id || '',
    };
    setMessages((prev) => [tempMessage, ...prev]);

    // Emit via socket
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
        {!isOutgoing && item.senderImageUrl ? (
          <Image source={{ uri: item.senderImageUrl }} style={styles.avatar} />
        ) : !isOutgoing ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.senderName?.charAt(0) || 'S'}</Text>
          </View>
        ) : null}

        <View style={[styles.bubble, isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming]}>
          <Text style={[styles.messageText, isOutgoing ? styles.textOutgoing : styles.textIncoming]}>
            {item.body}
          </Text>
          <Text style={[styles.timeText, isOutgoing ? styles.timeOutgoing : styles.timeIncoming]}>
            {item.createdAtString}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{spName || 'Chat'}</Text>
          <Text style={styles.headerSubtitle}>Job #{jobId.slice(-6)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContent}
        inverted
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.PlaceholderInactive}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Text style={styles.sendIcon}>➤</Text>
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
    backgroundColor: Colors.BGColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  back: {
    fontSize: FontSizes['2xl'],
    color: Colors.TitleColor,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  messagesContent: {
    padding: Spacing.lg,
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
    marginRight: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: '100%',
  },
  bubbleIncoming: {
    backgroundColor: Colors.TextFieldColor,
    borderBottomLeftRadius: 4,
  },
  bubbleOutgoing: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    lineHeight: 22,
  },
  textIncoming: {
    color: Colors.TitleColor,
  },
  textOutgoing: {
    color: Colors.BGColor,
  },
  timeText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  timeIncoming: {
    color: Colors.DescriptionTextLight,
  },
  timeOutgoing: {
    color: `${Colors.BGColor}AA`,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.CardColor,
    backgroundColor: Colors.BGColor,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
    maxHeight: 100,
    marginRight: Spacing.sm,
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
    backgroundColor: Colors.disabledGray,
  },
  sendIcon: {
    fontSize: FontSizes.md,
    color: Colors.BGColor,
    marginLeft: 2,
  },
});

export default ChatScreen;
