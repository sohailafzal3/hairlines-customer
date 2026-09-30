import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.fetchNotifications(0, 50);
      setNotifications(res.notificationData ?? []);
    } catch (e: any) {
      if (!isRefresh) showAlert("Error", e.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(false);
    }, [loadNotifications])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(true);
  };

  const handleNotificationPress = async (item: NotificationModel) => {
    if (item.notificationId && !item.isRead) {
      try {
        await api.actionOnNotification(item.notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === item.notificationId
              ? { ...n, isRead: true }
              : n
          )
        );
      } catch {}
    }

    if (item.jobId) {
      navigation.navigate("HomeTab", {
        screen: "JobDetails",
        params: { jobId: item.jobId },
      } as any);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.actionOnNotification("all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }: { item: NotificationModel }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleNotificationPress(item)}
    >
      <Card
        style={[
          styles.card,
          item.isRead ? styles.read : styles.unread,
        ]}
      >
        <View style={styles.row}>
          <Avatar uri={item.image} name={item.name || "Client"} size={46} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name || "Hairlines Pro"}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {item.message}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={Colors.DescriptionTextDark}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.time}>{item.timePassed || "Just now"}</Text>
              {Boolean(item.jobId) && (
                <View style={styles.viewJobBadge}>
                  <Text style={styles.viewJobText}>View Job</Text>
                  <Ionicons name="chevron-forward" size={10} color={Colors.ButtonPrimaryColor} />
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:notifications")}
        onBackPress={handleBack}
        right={
          <View style={styles.headerRightRow}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={styles.markReadBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.markReadText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              hitSlop={10}
              style={{ padding: 4 }}
            >
              <Ionicons name="menu" size={24} color={Colors.NavigationTitle} />
            </TouchableOpacity>
          </View>
        }
      />

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.notificationId || `${item.timePassed}-${index}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.ButtonPrimaryColor]}
            tintColor={Colors.ButtonPrimaryColor}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="notifications-outline"
              message="No notifications yet. You're all caught up!"
            />
          ) : null
        }
      />
      <LoadingOverlay visible={loading && !refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  listContent: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "#EEF4FF",
  },
  markReadText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
  },
  card: {
    marginVertical: 4,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: FontSizes.sm,
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
    fontSize: FontSizes.xs + 1,
    color: "#475569",
    marginTop: 3,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  time: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
  },
  viewJobBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewJobText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginRight: 2,
  },
  unread: {
    backgroundColor: "#EEF4FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
  },
  read: {
    backgroundColor: "#FFFFFF",
    borderColor: Colors.BorderColor,
    borderWidth: 1,
  },
});

