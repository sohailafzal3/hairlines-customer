import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { NotificationModel } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => markRead(item.notificationId)}
    >
      <Card style={[styles.card, item.isRead ? styles.read : styles.unread]}>
        <View style={styles.row}>
          <Avatar uri={item.image} name={item.name} size={48} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="notifications-outline"
              message="No notifications yet. You're all caught up!"
            />
          ) : null
        }
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  listContent: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  card: {
    marginVertical: 4,
    padding: Spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ButtonPrimaryColor,
    marginLeft: 6,
  },
  message: {
    fontSize: FontSizes.sm,
    color: "#475569",
    marginTop: 2,
    lineHeight: 18,
  },
  time: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 4,
  },
  unread: {
    backgroundColor: "#EEF4FF",
    borderColor: "#BFDBFE",
  },
  read: {
    backgroundColor: "#FFFFFF",
    borderColor: Colors.BorderColor,
  },
});

