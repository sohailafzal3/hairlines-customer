import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    data: spList,
    loading,
    execute: fetchSPList,
  } = useApi<SP[]>(JobsApi.fetchSPList);

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
      setSps(result);
    }
  };

  const renderItem = ({ item }: { item: SP }) => (
    <TouchableOpacity
      style={styles.spCard}
      onPress={() => navigation.navigate('WorkerProfile', { spProfileId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.spRow}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.spImage} />
        ) : (
          <View style={styles.spImagePlaceholder}>
            <Text style={styles.spImageText}>{item.name?.charAt(0) || 'W'}</Text>
          </View>
        )}
        <View style={styles.spInfo}>
          <Text style={styles.spName}>{item.name}</Text>
          <View style={styles.spMeta}>
            <Text style={styles.spRating}>⭐ {item.avgRating.toFixed(1)}</Text>
            <Text style={styles.spDistance}>• {item.distanceAway} away</Text>
          </View>
          <Text style={styles.spJobs}>{item.jobsDone} jobs completed</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Available Workers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Filters')}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sps}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👷</Text>
              <Text style={styles.emptyTitle}>No workers available</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your filters or selecting a different time
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
    backgroundColor: Colors.BGColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  back: {
    fontSize: FontSizes['2xl'],
    color: Colors.TitleColor,
  },
  title: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  filterIcon: {
    fontSize: FontSizes.lg,
  },
  listContent: {
    padding: Spacing.lg,
  },
  spCard: {
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
  spRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  spImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spImageText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
  },
  spInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  spName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  spMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  spRating: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.RadioActive,
    marginRight: Spacing.sm,
  },
  spDistance: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  spJobs: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  arrow: {
    fontSize: FontSizes.lg,
    color: Colors.DescriptionTextLight,
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

export default SuggestedMoversScreen;
