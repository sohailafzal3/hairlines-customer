import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
    data: rawNotifications,
    loading,
    error,
    execute: fetchNotifications,
  } = useApi<any>(NotificationsApi.fetchNotifications);

  useEffect(() => {
    loadNotifications();
  }, []);

  const getNotificationsList = (): NotificationModel[] => {
    if (Array.isArray(rawNotifications)) return rawNotifications;
    if (rawNotifications && typeof rawNotifications === 'object') {
      const obj = rawNotifications as any;
      if (Array.isArray(obj.notifications)) return obj.notifications;
      if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
  };

  const notificationsList = getNotificationsList();

  const loadNotifications = async () => {
    const result = await fetchNotifications(0);
    if (result && Array.isArray(result)) {
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
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const renderItem = ({ item }: { item: NotificationModel }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      activeOpacity={0.85}
    >
      <View style={[styles.iconCircle, !item.isRead && styles.iconCircleUnread]}>
        <Ionicons
          name={!item.isRead ? 'notifications' : 'notifications-outline'}
          size={20}
          color={!item.isRead ? Colors.ButtonPrimaryColor : '#64748B'}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.notificationTitle}>{item.name || 'Notification'}</Text>
          <Text style={styles.notificationTime}>{item.timePassed}</Text>
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).openDrawer?.()}
          style={styles.menuButton}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={styles.markReadTouch}>
          <Text style={styles.markReadText}>Mark Read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notificationsList}
        keyExtractor={(item) => item.notificationId || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.ButtonPrimaryColor]}
            tintColor={Colors.ButtonPrimaryColor}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                We'll notify you here about booking updates, promos, and service status.
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  markReadTouch: {
    padding: 6,
  },
  markReadText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#EEF4FF',
    borderColor: 'rgba(34, 45, 99, 0.2)',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconCircleUnread: {
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.xl,
  },
});

export default NotificationsScreen;
