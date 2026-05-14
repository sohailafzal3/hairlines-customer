import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
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
  const { setSelectedSp, createJob } = useJobStore();

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Worker Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {profile && (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
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
              {profile.avgRating > 0 && (
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingText}>⭐ {profile.avgRating.toFixed(1)}</Text>
                  <Text style={styles.jobCountText}>• {profile.jobCount} jobs done</Text>
                </View>
              )}
              {profile.about ? (
                <Text style={styles.aboutText}>{profile.about}</Text>
              ) : null}
            </View>

            {/* Services */}
            {profile.services && profile.services.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                {profile.services.map((service) => (
                  <View key={service.id} style={styles.serviceItem}>
                    <Text style={styles.serviceName}>{service.serviceName}</Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>
                      {service.serviceDescription}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.languageRow}>
                  {profile.languages.map((lang) => (
                    <View key={lang.id} style={styles.languageBadge}>
                      <Text style={styles.languageText}>{lang.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Tools */}
            {profile.tools && profile.tools.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tools & Equipment</Text>
                <View style={styles.toolsRow}>
                  {profile.tools.map((tool, index) => (
                    <View key={index} style={styles.toolBadge}>
                      <Text style={styles.toolText}>{tool}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reference Images */}
            {profile.referenceImages && profile.referenceImages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Portfolio</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {profile.referenceImages.map((img, index) => (
                    <Image key={index} source={{ uri: img }} style={styles.portfolioImage} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Reviews */}
            {profile.ratingAndReview && profile.ratingAndReview.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {profile.ratingAndReview.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewStars}>
                        {'⭐'.repeat(Math.round(review.rating))}
                      </Text>
                      <Text style={styles.reviewDate}>{review.createdAt}</Text>
                    </View>
                    <Text style={styles.reviewText}>{review.review}</Text>
                    <Text style={styles.reviewUser}>— {review.userName}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA */}
            <VTButton
              title="Select This Worker"
              onPress={handleSelectWorker}
              style={styles.selectButton}
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
    backgroundColor: Colors.BGColor,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
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
  back: {
    fontSize: FontSizes['2xl'],
    color: Colors.TitleColor,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileImageText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.RadioActive,
    marginRight: Spacing.sm,
  },
  jobCountText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  aboutText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.md,
  },
  serviceItem: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.base,
  },
  serviceName: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  serviceDesc: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageBadge: {
    backgroundColor: `${Colors.ButtonPrimaryColor}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  languageText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolBadge: {
    backgroundColor: Colors.TextFieldColor,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  toolText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  portfolioImage: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.base,
    marginRight: Spacing.md,
  },
  reviewItem: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.base,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  reviewStars: {
    fontSize: FontSizes.sm,
  },
  reviewDate: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  reviewText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.xs,
  },
  reviewUser: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.DescriptionTextLight,
  },
  selectButton: {
    margin: Spacing.lg,
    marginTop: Spacing.xl,
  },
});

export default WorkerProfileScreen;
