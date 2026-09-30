import React, { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { Job } from '../../models';
import { JobStatus } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyJobs'>;
};

type TabType = 'scheduled' | 'history';

const getStatusBadge = (status?: number) => {
  switch (status) {
    case JobStatus.Open:
      return { label: 'Finding Stylist', bg: '#EFF6FF', text: '#2563EB', icon: 'hourglass-outline' };
    case JobStatus.Accepted:
      return { label: 'Accepted', bg: '#ECFDF5', text: '#059669', icon: 'checkmark-circle-outline' };
    case JobStatus.Started:
      return { label: 'On The Way', bg: '#FEF3C7', text: '#D97706', icon: 'car-outline' };
    case JobStatus.Arrived:
      return { label: 'Arrived', bg: '#FEF3C7', text: '#D97706', icon: 'location-outline' };
    case JobStatus.StartJob:
      return { label: 'In Progress', bg: '#EEF2FF', text: '#4F46E5', icon: 'cut-outline' };
    case JobStatus.Completed:
    case JobStatus.Finished:
      return { label: 'Completed', bg: '#ECFDF5', text: '#059669', icon: 'checkmark-done-circle-outline' };
    case JobStatus.Rejected:
      return { label: 'Declined', bg: '#FEF2F2', text: '#DC2626', icon: 'close-circle-outline' };
    case JobStatus.Cancelled:
      return { label: 'Cancelled', bg: '#F1F5F9', text: '#64748B', icon: 'ban-outline' };
    default:
      return { label: 'Scheduled', bg: '#F1F5F9', text: '#475569', icon: 'calendar-outline' };
  }
};

const MyJobsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('scheduled');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const listType = activeTab === 'scheduled' ? 1 : 2;
      const res: any = await JobsApi.fetchJobListing(listType, 0);
      const list =
        res?.jobList ||
        res?.jobs ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        const mapped: Job[] = list.map((job: any) => ({
          id: job._id || job.id || job.jobId,
          _id: job._id || job.id || job.jobId,
          serviceName: job.serviceName || 'Grooming Service',
          subServiceName: job.subServiceName || '',
          serviceImage: job.serviceImage || '',
          status: job.spJobStatus !== undefined ? job.spJobStatus : (job.status !== undefined ? job.status : 1),
          spJobStatus: job.spJobStatus !== undefined ? job.spJobStatus : (job.status !== undefined ? job.status : 1),
          jobStartTime: job.jobStartTime ? (typeof job.jobStartTime === 'number' ? new Date(job.jobStartTime * 1000).toISOString() : String(job.jobStartTime)) : '',
          createdDate: job.createdDate || job.createdAt || '',
          primaryAddress: job.primaryAddress || job.address || '',
          totalAmount: Number(job.totalAmount) || Number(job.jobAmount?.totalAmount) || Number(job.costBreakDown?.totalAmount) || 0,
          currency: job.currency || '$',
          worker: job.worker || {
            id: job.spProfileId,
            name: job.name || job.spName || 'Hairlines Pro',
            profileImage: job.profileImage || '',
            avgRating: Number(job.avgRating) || 5.0,
          },
          costBreakDown: job.costBreakDown || job.jobAmount,
        }));
        setJobs(mapped);
      } else {
        setJobs([]);
      }
    } catch (e) {
      console.log('Error loading jobs:', e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCardPress = (jobId: string) => {
    navigation.getParent()?.navigate('HomeStack', {
      screen: 'JobDetails',
      params: { jobId },
    } as any);
  };

  const renderItem = ({ item }: { item: Job }) => {
    const badge = getStatusBadge(item.status);
    const dateStr = item.jobStartTime
      ? new Date(item.jobStartTime).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : item.createdDate || 'Scheduled';

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleCardPress(item._id || item.id || '')}
        activeOpacity={0.85}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.serviceRow}>
            <View style={styles.serviceIconBadge}>
              <MaterialCommunityIcons name="content-cut" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.serviceName}>{item.serviceName || item.subServiceName || 'Hair Styling'}</Text>
              <Text style={styles.dateTimeText}>{dateStr}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon as any} size={12} color={badge.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Worker & Location Info */}
        <View style={styles.cardBody}>
          <View style={styles.workerRow}>
            <Ionicons name="person-outline" size={16} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.workerName}>
              {item.spName || item.worker?.name || item.companyName || 'Assigned Hairstylist'}
            </Text>
          </View>

          <View style={[styles.workerRow, { marginTop: 6 }]}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.atSpLocation ? 'Stylist Studio / Salon' : item.primaryAddress || item.address || 'Address on file'}
            </Text>
          </View>
        </View>

        {/* Card Footer with Price & Chevron */}
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>
            ${item.totalAmount ? Number(item.totalAmount).toFixed(2) : item.serviceCharges ? Number(item.serviceCharges).toFixed(2) : '35.00'}
          </Text>
          <View style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.ButtonPrimaryColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity
          onPress={() => {
            if ((navigation as any).openDrawer) {
              (navigation as any).openDrawer();
            } else if ((navigation.getParent() as any)?.openDrawer) {
              (navigation.getParent() as any).openDrawer();
            } else {
              navigation.dispatch(DrawerActions.openDrawer());
            }
          }}
          style={styles.headerBtn}
        >
          <Ionicons name="menu" size={26} color={Colors.TitleColor} />
        </TouchableOpacity>
        <Text style={styles.title}>My Appointments</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scheduled' && styles.tabActive]}
          onPress={() => setActiveTab('scheduled')}
        >
          <Text style={[styles.tabText, activeTab === 'scheduled' && styles.tabTextActive]}>
            Upcoming & Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Past Appointments
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={jobs}
        keyExtractor={(item, index) => item._id || item.id || `job_${index}`}
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
                <Ionicons name="calendar-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'scheduled' ? 'No Upcoming Appointments' : 'No Past Appointments'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'scheduled'
                  ? 'Book a top-rated barber or stylist whenever you need a fresh cut or grooming service.'
                  : 'Your completed or cancelled appointments will appear here.'}
              </Text>
              {activeTab === 'scheduled' && (
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => navigation.getParent()?.navigate('HomeStack', { screen: 'Categories' } as any)}
                >
                  <Text style={styles.bookNowBtnText}>Book a Stylist</Text>
                </TouchableOpacity>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  serviceIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBody: {
    marginBottom: 10,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.TitleColor,
    marginLeft: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
    marginRight: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
  bookNowBtn: {
    marginTop: 20,
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MyJobsScreen;
