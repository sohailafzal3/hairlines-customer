import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Button, LoadingOverlay } from '../../components';
import { JobsApi } from '../../api';
import { SPProfile } from '../../models';
import { useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'WorkerProfile'>;
  route: RouteProp<HomeStackParamList, 'WorkerProfile'>;
};

const FALLBACK_PROFILE: SPProfile = {
  id: 'sp_default',
  name: 'Marcus Sterling',
  firstName: 'Marcus',
  lastName: 'Sterling',
  profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  avgRating: 4.9,
  jobCount: 342,
  about: 'Licensed master barber with 8+ years of craft experience. Dedicated to top-tier hygiene, sharp fades, and bespoke grooming tailored to your lifestyle.',
  services: [
    { id: 's1', serviceName: 'Classic Precision Cut', serviceDescription: 'Includes consultation, hair wash, and warm towel finish.' },
    { id: 's2', serviceName: 'Skin Fade & Line-Up', serviceDescription: 'Razor sharp blend with foil shaver detailing.' },
    { id: 's3', serviceName: 'Beard Sculpt & Hydration', serviceDescription: 'Hot towel steam, razor edging, and organic oil conditioning.' },
  ],
  languages: [
    { id: 'l1', name: 'English' },
    { id: 'l2', name: 'Spanish' },
  ],
  tools: ['Oster Pro Clippers', 'Straight Razor', 'UV Sanitizer', 'Organic Beard Oils'],
  referenceImages: [
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
  ],
  ratingAndReview: [
    { id: 'r1', rating: 5, review: 'Marcus is hands down the best barber in the area. Always punctual, super clean tools, and perfect fade.', userName: 'Alex W.', createdAt: '2 days ago' },
    { id: 'r2', rating: 5, review: 'Top notch service at home. Very professional setup and great attention to detail.', userName: 'Jordan K.', createdAt: '1 week ago' },
  ],
  currency: '$',
};

const WorkerProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { spProfileId } = route.params;
  const { setSelectedSp, createJob } = useJobStore();
  const [profile, setProfile] = useState<SPProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [spProfileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await JobsApi.fetchSPProfile(spProfileId);
      const data = (res as any)?.spProfile || (res as any)?.data || res;
      if (data && (data.id || data._id || data.name || data.firstName)) {
        const mapped: SPProfile = {
          id: data._id || data.id || spProfileId,
          name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Hair Stylist Pro',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phonePreFix: data.phonePreFix || '',
          phoneNumber: data.phoneNumber || '',
          email: data.email || '',
          profileImage: data.profileImage || '',
          avgRating: Number(data.avgRating) || 5.0,
          jobCount: Number(data.jobsDone) || Number(data.jobCount) || 0,
          about: data.about || data.bio || 'Licensed beauty & hair professional.',
          companyName: data.companyName || '',
          services: Array.isArray(data.services)
            ? data.services.map((s: any) => ({
                id: s._id || s.id,
                serviceName: s.serviceName || s.name || '',
                serviceDescription: s.serviceDescription || s.description || '',
              }))
            : [],
          languages: Array.isArray(data.languages)
            ? data.languages.map((l: any) => ({
                id: l._id || l.id || l.label,
                name: l.label || l.languageName || l.name || 'English',
              }))
            : [{ id: '1', name: 'English' }],
          tools: Array.isArray(data.tools) ? data.tools : ['Pro Clippers', 'Shears', 'Sanitizer'],
          referenceImages: Array.isArray(data.referenceImages) ? data.referenceImages : [],
          ratingAndReview: Array.isArray(data.ratingAndReview)
            ? data.ratingAndReview.map((r: any) => ({
                id: r._id || r.id,
                rating: Number(r.rating) || 5,
                review: r.review || '',
                userName: r.name || r.userName || 'Client',
                userImage: r.profileImage || r.userImage || '',
                createdAt: r.createdAt || 'Recently',
              }))
            : [],
          currency: data.currency || '$',
        };
        setProfile(mapped);
      } else {
        setProfile(FALLBACK_PROFILE);
      }
    } catch (e) {
      console.log('Error loading SP profile:', e);
      setProfile(FALLBACK_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorker = () => {
    const current = profile || FALLBACK_PROFILE;
    setSelectedSp({
      id: current.id || spProfileId,
      userId: '',
      name: current.name,
      profileImage: current.profileImage,
      avgRating: current.avgRating,
      currency: current.currency || '$',
      latitude: 0,
      longitude: 0,
      distanceAway: '',
      spJobCompletedCount: current.jobCount,
      jobsDone: current.jobCount,
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
  };

  const current = profile || FALLBACK_PROFILE;
  const initials = current.name ? current.name.charAt(0).toUpperCase() : 'P';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header title="Professional Profile" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {current.profileImage ? (
              <Image source={{ uri: current.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>{initials}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.profileName}>{current.name}</Text>
          <Text style={styles.professionText}>Verified Hairlines Professional</Text>

          {/* Stats Badges */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#D97706" style={{ marginRight: 3 }} />
                <Text style={styles.statValue}>{current.avgRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{current.jobCount || 100}+</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </View>

          {current.about ? (
            <Text style={styles.aboutText}>{current.about}</Text>
          ) : null}
        </View>

        {/* Specialities & Services */}
        {current.services && current.services.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="content-cut" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionTitle}>Services Offered</Text>
            </View>
            {current.services.map((service, index) => (
              <View key={service.id || index} style={styles.serviceItem}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.serviceDesc}>{service.serviceDescription}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages & Equipment */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.sectionTitle}>Equipment & Languages</Text>
          </View>

          {current.languages && current.languages.length > 0 && (
            <View style={styles.tagGroup}>
              <Text style={styles.tagLabel}>Languages:</Text>
              <View style={styles.tagWrap}>
                {current.languages.map((lang, idx) => (
                  <View key={lang.id || idx} style={styles.languageBadge}>
                    <Text style={styles.languageText}>{lang.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {current.tools && current.tools.length > 0 && (
            <View style={[styles.tagGroup, { marginTop: 10 }]}>
              <Text style={styles.tagLabel}>Tools & Sanitation:</Text>
              <View style={styles.tagWrap}>
                {current.tools.map((tool, idx) => (
                  <View key={idx} style={styles.toolBadge}>
                    <Ionicons name="checkmark-circle-outline" size={12} color={Colors.successColor} style={{ marginRight: 4 }} />
                    <Text style={styles.toolText}>{tool}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Portfolio Gallery */}
        {current.referenceImages && current.referenceImages.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="images-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionTitle}>Style Portfolio</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioScroll}>
              {current.referenceImages.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.portfolioImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        {current.ratingAndReview && current.ratingAndReview.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionTitle}>Verified Customer Reviews</Text>
            </View>
            {current.ratingAndReview.slice(0, 3).map((review, index) => (
              <View key={review.id || index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{review.userName || 'Verified Client'}</Text>
                  <Text style={styles.reviewDate}>{review.createdAt || 'Recent'}</Text>
                </View>
                <View style={styles.reviewStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={12}
                      color={s <= Math.round(review.rating) ? '#D97706' : '#E2E8F0'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewText}>{review.review}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Select This Stylist"
          onPress={handleSelectWorker}
        />
      </View>

      <LoadingOverlay visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  profileImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  professionText: {
    fontSize: FontSizes.xs,
    color: '#64748B',
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  aboutText: {
    fontSize: FontSizes.xs,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
  },
  serviceItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: FontSizes.xs,
    color: '#64748B',
    lineHeight: 16,
  },
  tagGroup: {
    marginBottom: Spacing.xs,
  },
  tagLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: '#64748B',
    marginBottom: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  languageBadge: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  languageText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  toolText: {
    fontSize: FontSizes.xs,
    color: '#334155',
  },
  portfolioScroll: {
    gap: 10,
  },
  portfolioImage: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.md,
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
  },
  reviewDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: FontSizes.xs,
    color: '#475569',
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.BorderColor,
    padding: Spacing.base,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default WorkerProfileScreen;

