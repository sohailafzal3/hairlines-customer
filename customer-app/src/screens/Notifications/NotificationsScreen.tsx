import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header } from '../../components';
import { NotificationsApi } from '../../api';
import { useUserStore } from '../../store';
import { NotificationModel } from '../../models';
import { VTLoading } from '../../components/common';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Notifications'>;
};

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setNotificationBadge } = useUserStore();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res: any = await NotificationsApi.fetchNotifications(0);
      const list =
        res?.notificationData ||
        res?.notifications ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: NotificationModel[] = list.map((item: any) => ({
          notificationId: item._id || item.notificationId || item.id || '',
          notificationType: item.notificationType || 0,
          jobId: item.jobId || item.resource?.packageId || '',
          isRead: item.isRead ?? false,
          name: item.name || 'Hairlines',
          message: typeof item.message === 'string' ? item.message.replace(/<[^>]*>?/gm, '') : item.alert || '',
          timePassed: item.timeAgo || item.timePassed || '',
          image: item.profileImage || item.image || '',
          shouldNavigate: item.shouldNavigate ?? true,
        }));
        setNotifications(mapped);
        const unread = mapped.filter((n) => !n.isRead).length;
        setNotificationBadge(unread);
      }
    } catch (e) {
      console.log('Notifications error:', e);
    } finally {
      setLoading(false);
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
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotificationBadge(0);
      Toast.show({ type: 'success', text1: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await NotificationsApi.actionNotifications('delete');
      setNotifications([]);
      setNotificationBadge(0);
      Toast.show({ type: 'success', text1: 'Notifications cleared' });
    } catch (error) {
      console.error('Clear notifications error:', error);
    }
  };

  const renderItem = ({ item }: { item: NotificationModel }) => {
    const isUnread = !item.isRead;

    return (
      <View style={[styles.notificationCard, isUnread && styles.notificationCardUnread]}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={isUnread ? 'notifications' : 'notifications-outline'}
            size={20}
            color={Colors.ButtonPrimaryColor}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
              {item.name || item.title || 'Hairlines Update'}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.cardMessage}>{item.message || item.body || ''}</Text>

          {item.timePassed ? (
            <Text style={styles.cardTime}>{item.timePassed}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Notifications"
        left={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              if ((navigation as any).openDrawer) {
                (navigation as any).openDrawer();
              } else if ((navigation.getParent() as any)?.openDrawer) {
                (navigation.getParent() as any).openDrawer();
              } else {
                navigation.dispatch(DrawerActions.openDrawer());
              }
            }}
          >
            <Ionicons name="menu" size={26} color={Colors.TitleColor} />
          </TouchableOpacity>
        }
        right={
          notifications.length > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.markReadText}>Mark read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item.notificationId || `notif_${index}`}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.ButtonPrimaryColor]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up! Updates regarding your bookings and promotions will appear here.
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading && !refreshing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationCardUnread: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}04`,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: FontWeights.semibold,
    color: '#475569',
  },
  cardTitleUnread: {
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  cardMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationsScreen;
