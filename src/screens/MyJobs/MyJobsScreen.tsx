import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { Job } from '../../models';
import { JobStatus } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyJobs'>;
};

type TabType = 'scheduled' | 'history';

const getStatusLabel = (status: number): string => {
  switch (status) {
    case JobStatus.Open: return 'Open';
    case JobStatus.Accepted: return 'Accepted';
    case JobStatus.Started: return 'Started';
    case JobStatus.Arrived: return 'Arrived';
    case JobStatus.StartJob: return 'In Progress';
    case JobStatus.Completed: return 'Completed';
    case JobStatus.Finished: return 'Finished';
    case JobStatus.Rejected: return 'Rejected';
    case JobStatus.Cancelled: return 'Cancelled';
    default: return 'Unknown';
  }
};

const getStatusColor = (status: number): string => {
  switch (status) {
    case JobStatus.Open: return Colors.ButtonPrimaryRight;
    case JobStatus.Accepted: return '#4CAF50';
    case JobStatus.Started:
    case JobStatus.Arrived:
    case JobStatus.StartJob: return '#FF9800';
    case JobStatus.Completed:
    case JobStatus.Finished: return '#4CAF50';
    case JobStatus.Rejected:
    case JobStatus.Cancelled: return Colors.errorViewColor;
    default: return Colors.DescriptionTextLight;
  }
};

const MyJobsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('scheduled');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: scheduledJobs,
    loading: scheduledLoading,
    execute: fetchScheduled,
  } = useApi<Job[]>(JobsApi.fetchJobListing);

  const {
    data: historyJobs,
    loading: historyLoading,
    execute: fetchHistory,
  } = useApi<Job[]>(JobsApi.fetchJobListing);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'scheduled') {
      await fetchScheduled('upcoming', 0);
    } else {
      await fetchHistory('past', 0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const jobs = activeTab === 'scheduled' ? scheduledJobs : historyJobs;
  const loading = activeTab === 'scheduled' ? scheduledLoading : historyLoading;

  const renderItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() =>
        navigation.getParent()?.navigate('HomeStack', {
          screen: 'JobDetails',
          params: { jobId: item.id },
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.jobHeader}>
        {item.serviceImage ? (
          <Image source={{ uri: item.serviceImage }} style={styles.serviceImage} />
        ) : (
          <View style={styles.serviceImagePlaceholder}>
            <Text>📦</Text>
          </View>
        )}
        <View style={styles.jobInfo}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.spName}>{item.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{item.primaryAddress}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.spJobStatus)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.spJobStatus) }]}>
            {getStatusLabel(item.spJobStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.dateText}>{item.jobStartTime}</Text>
        <Text style={styles.amountText}>
          {item.currency}{item.totalAmount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Services</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scheduled' && styles.tabActive]}
          onPress={() => setActiveTab('scheduled')}
        >
          <Text style={[styles.tabText, activeTab === 'scheduled' && styles.tabTextActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      <FlatList
        data={jobs || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>
                No {activeTab} jobs
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'scheduled'
                  ? 'Book a service to see your scheduled jobs here'
                  : 'Your completed jobs will appear here'}
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
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.ButtonPrimaryColor,
  },
  tabText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.DescriptionTextLight,
  },
  tabTextActive: {
    color: Colors.ButtonPrimaryColor,
  },
  listContent: {
    padding: Spacing.lg,
  },
  jobCard: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  serviceImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.base,
  },
  serviceImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.TextFieldColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  serviceName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  spName: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: 2,
  },
  address: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.CardColor,
    paddingTop: Spacing.md,
  },
  dateText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  amountText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
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

export default MyJobsScreen;
