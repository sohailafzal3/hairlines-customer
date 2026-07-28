import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
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
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { Job } from '../../models';
import { SPJobStatus } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyJobs'>;
};

type SegmentTab = 'upcoming' | 'history';

const MyJobsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<SegmentTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: jobsData,
    loading,
    execute: fetchMyJobs,
  } = useApi<any>(JobsApi.fetchMyJobs);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    await fetchMyJobs(0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const getJobsArray = (): Job[] => {
    if (Array.isArray(jobsData)) return jobsData;
    if (jobsData && typeof jobsData === 'object') {
      const obj = jobsData as any;
      if (Array.isArray(obj.jobs)) return obj.jobs;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.list)) return obj.list;
    }
    return [];
  };

  const allJobs = getJobsArray();

  const filteredJobs = allJobs.filter((job) => {
    const isCompletedOrCancelled =
      job.spJobStatus === SPJobStatus.completed ||
      job.spJobStatus === SPJobStatus.cancelledBySP ||
      job.spJobStatus === SPJobStatus.cancelledByUser;

    return activeTab === 'upcoming' ? !isCompletedOrCancelled : isCompletedOrCancelled;
  });

  const getStatusStyle = (status: number) => {
    switch (status) {
      case SPJobStatus.open:
        return { bg: '#FEF3C7', text: '#D97706' };
      case SPJobStatus.spAccepted:
      case SPJobStatus.spStarted:
      case SPJobStatus.spArrivedAtLocation:
        return { bg: '#DBEAFE', text: '#2563EB' };
      case SPJobStatus.completed:
        return { bg: '#DCFCE7', text: '#16A34A' };
      case SPJobStatus.cancelledBySP:
      case SPJobStatus.cancelledByUser:
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case SPJobStatus.open:
        return 'Searching Barber';
      case SPJobStatus.spAccepted:
        return 'Confirmed';
      case SPJobStatus.spStarted:
        return 'In Progress';
      case SPJobStatus.spArrivedAtLocation:
        return 'Arrived';
      case SPJobStatus.completed:
        return 'Completed';
      case SPJobStatus.cancelledBySP:
        return 'Cancelled';
      case SPJobStatus.cancelledByUser:
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const renderItem = ({ item }: { item: Job }) => {
    const statusStyle = getStatusStyle(item.spJobStatus);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => (navigation as any).navigate('HomeStack', { screen: 'JobDetails', params: { jobId: item.id } })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.spImage} />
          ) : (
            <View style={styles.spImagePlaceholder}>
              <Text style={styles.spImageText}>{item.name?.charAt(0) || 'B'}</Text>
            </View>
          )}

          <View style={styles.spInfo}>
            <Text style={styles.spName}>{item.name || 'Assigned Barber'}</Text>
            <Text style={styles.serviceName}>{item.serviceName || 'Grooming Service'}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              📍 {item.primaryAddress || 'Customer Location'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {getStatusLabel(item.spJobStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>{item.jobStartTime || 'Scheduled Time'}</Text>
          </View>

          <View style={styles.footerRight}>
            <TouchableOpacity
              style={styles.chatPill}
              onPress={() => (navigation as any).navigate('HomeStack', { screen: 'Chat', params: { jobId: item.id, spName: item.name } })}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
              <Text style={styles.chatPillText}>Chat</Text>
            </TouchableOpacity>

            <Text style={styles.amountText}>
              {item.currency || '$'}{item.totalAmount || '0.00'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Segment Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabSegment, activeTab === 'upcoming' && styles.tabSegmentActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming Bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSegment, activeTab === 'history' && styles.tabSegmentActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Booking History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
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
              <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Book a new haircut or grooming service to get started.'
                  : 'Your completed and cancelled booking history will appear here.'}
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading && !refreshing && allJobs.length === 0} />
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: Spacing.sm,
  },
  tabSegment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  tabSegmentActive: {
    backgroundColor: '#EEF4FF',
  },
  tabText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  spImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Spacing.md,
  },
  spImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  spImageText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  spInfo: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  spName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  serviceName: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
    marginTop: 2,
  },
  addressText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.15)',
  },
  chatPillText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  amountText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
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

export default MyJobsScreen;
