import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { SP } from '../../models';
import { useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SuggestedMovers'>;
};

const SuggestedMoversScreen: React.FC<Props> = ({ navigation }) => {
  const { createJob } = useJobStore();
  const [sps, setSps] = useState<SP[]>([]);

  const {
    data: rawSPList,
    loading,
    execute: fetchSPList,
  } = useApi<any>(JobsApi.fetchSPList);

  useEffect(() => {
    loadSPs();
  }, []);

  const loadSPs = async () => {
    const params = {
      subServiceId: createJob.subServiceId,
      latitude: createJob.latitude,
      longitude: createJob.longitude,
      jobStartTime: createJob.jobStartTime,
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
    const result = await fetchSPList(params);
    if (result) {
      if (Array.isArray(result)) {
        setSps(result);
      } else if (typeof result === 'object') {
        const obj = result as any;
        if (Array.isArray(obj.sps)) setSps(obj.sps);
        else if (Array.isArray(obj.data)) setSps(obj.data);
      }
    }
  };

  const renderItem = ({ item }: { item: SP }) => (
    <TouchableOpacity
      style={styles.spCard}
      onPress={() => navigation.navigate('WorkerProfile', { spProfileId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.spRow}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.spImage} />
        ) : (
          <View style={styles.spImagePlaceholder}>
            <Text style={styles.spImageText}>{item.name?.charAt(0) || 'B'}</Text>
          </View>
        )}

        <View style={styles.spInfo}>
          <Text style={styles.spName}>{item.name}</Text>
          <View style={styles.spMetaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#854D0E" style={{ marginRight: 3 }} />
              <Text style={styles.spRating}>{item.avgRating?.toFixed(1) || '5.0'}</Text>
            </View>

            {item.distanceAway ? (
              <Text style={styles.spDistance}>• {item.distanceAway} away</Text>
            ) : null}
          </View>
          <Text style={styles.spJobs}>{item.jobsDone || 0} completed bookings</Text>
        </View>

        <View style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={18} color={Colors.ButtonPrimaryColor} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Professionals</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Filters')}
          style={styles.filterButton}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={Colors.ButtonPrimaryColor} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sps}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>SELECT A BARBER / STYLIST</Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No professionals found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search location or filters to find active barbers in your area.
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading} />
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
  backButton: {
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.15)',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  spCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  spRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  spImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spImageText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  spInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.xs,
  },
  spName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  spMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  spRating: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#854D0E',
  },
  spDistance: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  spJobs: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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

export default SuggestedMoversScreen;
