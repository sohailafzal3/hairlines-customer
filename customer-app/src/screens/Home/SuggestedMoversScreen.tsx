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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, EmptyState, LoadingOverlay } from '../../components';
import { JobsApi } from '../../api';
import { SP } from '../../models';
import { useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SuggestedMovers'>;
};

const MOCK_FREELANCERS: SP[] = [
  {
    id: 'sp_1',
    name: 'Marcus Sterling',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    avgRating: 4.9,
    ratingCount: 128,
    distanceAway: '1.2 mi',
    jobsDone: 342,
    servicePrice: 40,
    hourlyRate: 45,
    isHourly: false,
    about: 'Master barber with 8+ years specializing in modern fades, beard sculpting and hair designs.',
    isCompany: false,
  },
  {
    id: 'sp_2',
    name: 'Elena Rostova',
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    avgRating: 5.0,
    ratingCount: 94,
    distanceAway: '2.4 mi',
    jobsDone: 215,
    servicePrice: 55,
    hourlyRate: 60,
    isHourly: false,
    about: 'Certified stylist specializing in color correction, precision bob cuts, and luxury treatments.',
    isCompany: false,
  },
  {
    id: 'sp_3',
    name: 'Darius Thorne',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    avgRating: 4.8,
    ratingCount: 76,
    distanceAway: '3.1 mi',
    jobsDone: 180,
    servicePrice: 35,
    hourlyRate: 40,
    isHourly: false,
    about: 'Mobile barber offering on-demand executive cuts, razor line-ups, and hot towel facial treatments.',
    isCompany: false,
  },
];

const MOCK_COMPANIES: SP[] = [
  {
    id: 'sp_comp_1',
    name: 'Crown & Blade Grooming Studio',
    profileImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
    avgRating: 4.9,
    ratingCount: 310,
    distanceAway: '1.8 mi',
    jobsDone: 890,
    servicePrice: 45,
    hourlyRate: 50,
    isHourly: false,
    about: 'Premier barber lounge with a full team of certified specialists ready to serve at our studio or your home.',
    isCompany: true,
  },
  {
    id: 'sp_comp_2',
    name: 'Velvet Hair & Spa Collective',
    profileImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80',
    avgRating: 4.9,
    ratingCount: 220,
    distanceAway: '2.9 mi',
    jobsDone: 640,
    servicePrice: 65,
    hourlyRate: 70,
    isHourly: false,
    about: 'Full-service luxury salon and wellness group specializing in hair treatments, cuts, and braiding.',
    isCompany: true,
  },
];

const SuggestedMoversScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createJob, setCreateJobField } = useJobStore();
  const [activeTab, setActiveTab] = useState<'freelancer' | 'company'>('freelancer');
  const [sps, setSps] = useState<SP[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSPs();
  }, [createJob.isFilterApplied]);

  const loadSPs = async () => {
    try {
      setLoading(true);
      const params = {
        subServiceId: createJob.subServiceId,
        latitude: createJob.latitude || 37.7749,
        longitude: createJob.longitude || -122.4194,
        jobStartTime: createJob.jobStartTime,
        companyId: createJob.merchantId || '',
        provideServiceInPremises: createJob.atSpLocation,
        provideServiceInUserPremises: createJob.atUserLocation,
        weekDay: createJob.weekDay,
        timeZone: createJob.timeZone,
        isFilterApplied: createJob.isFilterApplied,
        minRating: createJob.minRating,
        maxRating: createJob.maxRating,
        distance: createJob.distance,
        gender: createJob.barberGender,
      };
      const result: any = await JobsApi.fetchSPList(params);
      const list = (result as any)?.spList || (result as any)?.data || (Array.isArray(result) ? result : []);
      if (Array.isArray(list) && list.length > 0) {
        setSps(list);
      } else {
        setSps(MOCK_FREELANCERS);
      }
    } catch (e) {
      console.log('Error fetching SP list:', e);
      setSps(MOCK_FREELANCERS);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSPs();
    setRefreshing(false);
  };

  const displayedList = activeTab === 'freelancer'
    ? sps.filter((s) => !s.isCompany)
    : (sps.filter((s) => s.isCompany).length > 0 ? sps.filter((s) => s.isCompany) : MOCK_COMPANIES);

  const handleSelectSP = (sp: SP) => {
    setCreateJobField('worker', sp);
    setCreateJobField('selectedSp', sp);
    setCreateJobField('spProfileId', sp.id);
    navigation.navigate('WorkerProfile', { spProfileId: sp.id });
  };

  const renderItem = ({ item }: { item: SP }) => {
    const initials = item.name ? item.name.charAt(0).toUpperCase() : 'P';
    const rating = item.avgRating ? item.avgRating.toFixed(1) : '5.0';

    return (
      <TouchableOpacity
        style={styles.spCard}
        onPress={() => handleSelectSP(item)}
        activeOpacity={0.85}
      >
        <View style={styles.spRow}>
          {/* Avatar with rating badge */}
          <View style={styles.avatarWrapper}>
            {item.profileImage ? (
              <Image source={{ uri: item.profileImage }} style={styles.spImage} />
            ) : (
              <View style={styles.spImagePlaceholder}>
                <Text style={styles.spImageText}>{initials}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          {/* Info Details */}
          <View style={styles.spInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.spName} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name="shield-checkmark" size={15} color={Colors.ButtonPrimaryColor} />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#D97706" style={{ marginRight: 3 }} />
                <Text style={styles.ratingText}>{rating}</Text>
                {item.ratingCount ? (
                  <Text style={styles.ratingCount}> ({item.ratingCount})</Text>
                ) : null}
              </View>

              <View style={styles.distanceBadge}>
                <Ionicons name="location-outline" size={12} color="#64748B" style={{ marginRight: 2 }} />
                <Text style={styles.distanceText}>{item.distanceAway || '2.0 mi'}</Text>
              </View>
            </View>

            {item.about ? (
              <Text style={styles.aboutText} numberOfLines={2}>
                {item.about}
              </Text>
            ) : null}

            <View style={styles.bottomMetaRow}>
              <Text style={styles.jobsText}>
                {item.jobsDone || 100}+ bookings completed
              </Text>
              {item.servicePrice || item.hourlyRate ? (
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>
                    ${item.servicePrice || item.hourlyRate}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Available Stylists"
        onBackPress={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => navigation.navigate('Filters')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="options-outline" size={22} color={Colors.TitleColor} />
          </TouchableOpacity>
        }
      />

      {/* Segmented Tab Controls */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'freelancer' && styles.tabButtonActive]}
          onPress={() => setActiveTab('freelancer')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person"
            size={16}
            color={activeTab === 'freelancer' ? '#FFFFFF' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'freelancer' && styles.tabTextActive]}>
            Independent Pros
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'company' && styles.tabButtonActive]}
          onPress={() => setActiveTab('company')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="business"
            size={16}
            color={activeTab === 'company' ? '#FFFFFF' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'company' && styles.tabTextActive]}>
            Salons & Teams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stylist Card Listing */}
      <FlatList
        data={displayedList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.ButtonPrimaryColor]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              title="No Stylists Available"
              description="Try adjusting your filters or search radius to find stylists in your area."
            />
          ) : null
        }
      />

      <LoadingOverlay visible={loading && !refreshing} message="Finding nearby stylists..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  filterBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  tabButtonActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeights.bold,
  },
  listContent: {
    padding: Spacing.base,
  },
  spCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  spRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  spImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
  },
  spImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spImageText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: FontWeights.bold,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  spInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  spName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    flex: 1,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: '#92400E',
  },
  ratingCount: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: FontWeights.medium,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: FontWeights.medium,
  },
  aboutText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  jobsText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: FontWeights.medium,
  },
  pricePill: {
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
});

export default SuggestedMoversScreen;
