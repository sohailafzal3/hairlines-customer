import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { socketManager } from "../../../services/socket";
import { useUser } from "../../../context/UserContext";
import { Message } from "../../../types";

type Props = NativeStackScreenProps<HomeTabParamList, "Chat">;

export function ChatScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { jobId, title } = route.params;
  const { user } = useUser();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const mapMessage = (m: Message): IMessage => ({
    _id: m.id || `${m.createdAt}`,
    text: m.body || "",
    createdAt: m.createdAt ? new Date(m.createdAt * 1000) : new Date(),
    user: {
      _id: m.senderType === 2 ? user.id : m.userId || "user",
      name: m.senderName || "Customer",
      avatar: m.senderImageUrl,
    },
  });

  useEffect(() => {
    api
      .getPreviousChat(jobId, 0, 50)
      .then((res) => {
        const list = (res.messages ?? []).reverse().map(mapMessage);
        setMessages(list);
      })
      .finally(() => setLoading(false));

    const unsubscribe = socketManager.on("messageSendingToReceiverKey", (data) => {
      const incoming: Message = data?.resource || data?.message;
      if (incoming?.jobId === jobId) {
        setMessages((prev) => [mapMessage(incoming), ...prev]);
      }
    });
    return unsubscribe;
  }, [jobId]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text;
      if (!text) return;
      socketManager.sendMessage(text, jobId, user.id);
      setMessages((prev) => GiftedChat.append(prev, newMessages));
    },
    [jobId, user.id]
  );

  return (
    <View style={styles.container}>
      <Header title={title || t("job:chat")} onBackPress={() => navigation.goBack()} />
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: user.id }}
        isInverted
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
