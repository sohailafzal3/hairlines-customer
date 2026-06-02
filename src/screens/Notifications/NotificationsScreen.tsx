import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { NotificationsApi } from '../../api';
import { useApi } from '../../hooks';
import { useUserStore } from '../../store';
import { NotificationModel } from '../../models';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Notifications'>;
};

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { setNotificationBadge } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: notifications,
    loading,
    error,
    execute: fetchNotifications,
  } = useApi<NotificationModel[]>(NotificationsApi.fetchNotifications);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const result = await fetchNotifications(0);
    if (result) {
      const unreadCount = result.filter((n) => !n.isRead).length;
      setNotificationBadge(unreadCount);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationsApi.actionNotifications('read');
      await loadNotifications();
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const renderItem = ({ item }: { item: NotificationModel }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.notificationUnread]}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔔</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.notificationTitle}>{item.name || 'Notification'}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{item.timePassed}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications || []}
        keyExtractor={(item) => item.notificationId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔕</Text>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                You don't have any notifications yet
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading && !refreshing} />
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
  menuIcon: {
    fontSize: FontSizes.xl,
    width: 40,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  markReadText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
    width: 80,
    textAlign: 'right',
  },
  listContent: {
    padding: Spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  notificationUnread: {
    backgroundColor: `${Colors.ButtonPrimaryColor}05`,
    borderColor: `${Colors.ButtonPrimaryColor}20`,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: FontSizes.xl,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ButtonPrimaryColor,
    marginLeft: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyEmoji: {
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

export default NotificationsScreen;
