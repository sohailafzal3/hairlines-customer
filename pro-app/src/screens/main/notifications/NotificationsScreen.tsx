import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { NotificationModel } from "../../../types";

type Props = DrawerScreenProps<MainDrawerParamList, "Notifications">;

export function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.fetchNotifications(0, 50);
      setNotifications(res.notificationData ?? []);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id?: string) => {
    if (!id) return;
    try {
      await api.actionOnNotification(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const renderItem = ({ item }: { item: NotificationModel }) => (
    <TouchableOpacity onPress={() => markRead(item.notificationId)}>
      <Card style={item.isRead ? styles.read : styles.unread}>
        <View style={styles.row}>
          <Avatar uri={item.image} name={item.name} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{item.timePassed}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:notifications")}
        onMenuPress={() => navigation.openDrawer()}
      />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.notificationId || `${item.timePassed}`}
        contentContainerStyle={{ padding: 16 }}
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  message: { fontSize: 14, color: "#555", marginTop: 2 },
  time: { fontSize: 12, color: "#999", marginTop: 4 },
  unread: { backgroundColor: "#F1F8E9" },
  read: { backgroundColor: "#fff" },
});
