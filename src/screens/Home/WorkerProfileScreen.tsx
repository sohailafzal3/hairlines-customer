import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { SPProfile } from '../../models';
import { useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'WorkerProfile'>;
  route: RouteProp<HomeStackParamList, 'WorkerProfile'>;
};

const WorkerProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { spProfileId } = route.params;
  const { setSelectedSp } = useJobStore();

  const {
    data: profile,
    loading,
    execute: fetchProfile,
  } = useApi<SPProfile>(JobsApi.fetchSPProfile);

  useEffect(() => {
    fetchProfile(spProfileId);
  }, [spProfileId]);

  const handleSelectWorker = () => {
    if (profile) {
      setSelectedSp({
        id: profile.id,
        userId: '',
        name: profile.name,
        profileImage: profile.profileImage,
        avgRating: profile.avgRating,
        currency: profile.currency,
        latitude: 0,
        longitude: 0,
        distanceAway: '',
        spJobCompletedCount: profile.jobCount,
        jobsDone: profile.jobCount,
        spPrimaryAddress: '',
        spCity: '',
        spState: '',
        spCountry: '',
        provideServiceInPremisis: false,
        provideServiceInUserPremisis: false,
        permanentAddressLat: 0,
        permanentAddressLong: 0,
      });
      navigation.navigate('JobSummary');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {profile && (
          <>
            {/* Barber Profile Card */}
            <View style={styles.profileCard}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>
                    {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                  </Text>
                </View>
              )}

              <Text style={styles.profileName}>{profile.name}</Text>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#854D0E" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{profile.avgRating?.toFixed(1) || '5.0'}</Text>
                <Text style={styles.jobCountText}>({profile.jobCount || 0} bookings completed)</Text>
              </View>

              {profile.about ? (
                <Text style={styles.aboutText}>{profile.about}</Text>
              ) : null}
            </View>

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>LANGUAGES SPOKEN</Text>
                <View style={styles.badgeRow}>
                  {profile.languages.map((lang) => (
                    <View key={lang.id} style={styles.langPill}>
                      <Ionicons name="chatbubbles-outline" size={14} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
                      <Text style={styles.langText}>{lang.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Portfolio Gallery */}
            {profile.referenceImages && profile.referenceImages.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>PORTFOLIO WORK</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                  {profile.referenceImages.map((img, index) => (
                    <Image key={index} source={{ uri: img }} style={styles.portfolioImage} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Customer Reviews */}
            {profile.ratingAndReview && profile.ratingAndReview.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>CLIENT REVIEWS</Text>
                {profile.ratingAndReview.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewStars}>
                        {[...Array(Math.round(review.rating || 5))].map((_, i) => (
                          <Ionicons key={i} name="star" size={12} color="#EAB308" />
                        ))}
                      </View>
                      <Text style={styles.reviewDate}>{review.createdAt || 'Recent'}</Text>
                    </View>
                    <Text style={styles.reviewText}>{review.review}</Text>
                    <Text style={styles.reviewUser}>— {review.userName || 'Client'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Select Worker Button */}
            <VTButton
              title="Select This Professional"
              onPress={handleSelectWorker}
              style={styles.selectButton}
              textStyle={styles.selectButtonText}
            />
          </>
        )}
      </ScrollView>

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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.md,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileImageText: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginVertical: Spacing.sm,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#854D0E',
    marginRight: 4,
  },
  jobCountText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#854D0E',
  },
  aboutText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  langText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  portfolioImage: {
    width: 130,
    height: 130,
    borderRadius: BorderRadius.lg,
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
  },
  reviewText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveRegular,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
  },
  selectButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.md,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  selectButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default WorkerProfileScreen;
