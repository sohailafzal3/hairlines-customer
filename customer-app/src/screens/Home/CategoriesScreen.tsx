import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useAuthStore, useJobStore, useUserStore } from '../../store';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Categories'>;
};

interface ServiceCategory {
  _id?: string;
  id?: string;
  serviceTypeName?: string;
  name?: string;
  serviceTypeDescription?: string;
  description?: string;
  serviceTypeImage?: string;
  image?: string;
  iconName?: string;
}

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat_mens_haircut',
    serviceTypeName: "Men's Haircut & Grooming",
    serviceTypeDescription: 'Fades, tapers, beard sculpts, razor shaves & styling.',
    iconName: 'cut',
  },
  {
    id: 'cat_womens_salon',
    serviceTypeName: "Women's Salon & Haircare",
    serviceTypeDescription: 'Blowouts, coloring, precision cuts, balayage & treatments.',
    iconName: 'sparkles',
  },
  {
    id: 'cat_braiding_locs',
    serviceTypeName: 'Braids, Locs & Twists',
    serviceTypeDescription: 'Box braids, knotless, cornrows, loc maintenance & styling.',
    iconName: 'flower',
  },
  {
    id: 'cat_kids_styling',
    serviceTypeName: 'Kids & Teens Haircut',
    serviceTypeDescription: 'Gentle, patient haircutting and styling for children.',
    iconName: 'happy',
  },
  {
    id: 'cat_facial_spa',
    serviceTypeName: 'Facial, Steam & Grooming',
    serviceTypeDescription: 'Black mask, hot towel exfoliation, scalp massage & facial care.',
    iconName: 'water',
  },
];

const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { setCreateJobField } = useJobStore();
  const { notificationBadge } = useUserStore();

  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Unrated Job State
  const [unratedJob, setUnratedJob] = useState<any>(null);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [tipAmount, setTipAmount] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadData();
    checkUnratedJob();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res: any = await JobsApi.fetchServiceTypes();
      const list = res?.serviceTypes || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      console.log('Categories fetch error:', e);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const checkUnratedJob = async () => {
    try {
      const res: any = await JobsApi.fetchUnratedJobs();
      const job = res?.job || res?.data || (Array.isArray(res) ? res[0] : null);
      if (job && !job.isUserRated && (job.status === 4 || job.spJobStatus === 4 || job.status === 5)) {
        setUnratedJob(job);
        setIsRatingModalVisible(true);
      }
    } catch (e) {
      // ignore
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectCategory = (item: ServiceCategory) => {
    const serviceTypeId = item._id || item.id || '';
    const serviceTypeName = item.serviceTypeName || item.name || '';
    setCreateJobField('serviceTypeId', serviceTypeId);
    setCreateJobField('serviceTypeName', serviceTypeName);
    navigation.navigate('Services', {
      serviceTypeId,
      serviceTypeName,
    });
  };

  const handleRateSubmit = async () => {
    if (!unratedJob) return;
    try {
      setSubmittingRating(true);
      const jobId = unratedJob._id || unratedJob.id || unratedJob.jobId;
      const spId = unratedJob.spProfileId || unratedJob.worker?.id || unratedJob.workerId;
      await JobsApi.rateSP({
        jobId,
        spProfileId: spId,
        rating: ratingStars,
        review: reviewText.trim(),
        gratuity: tipAmount,
      });
      setIsRatingModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Review Submitted!',
        text2: 'Thank you for your feedback.',
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit review');
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderItem = ({ item }: { item: ServiceCategory }) => {
    const title = item.serviceTypeName || item.name || 'Grooming Service';
    const description = item.serviceTypeDescription || item.description || 'Premium grooming & styling';
    const iconName = item.iconName || 'cut';

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleSelectCategory(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName as any} size={24} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar with Status Bar Top Inset */}
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
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={26} color={Colors.TitleColor} />
        </TouchableOpacity>

        {/* Location Selector */}
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={() => navigation.navigate('SetLocation')}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={16} color={Colors.ButtonPrimaryColor} />
          <View style={{ marginHorizontal: 6, flex: 1 }}>
            <Text style={styles.locationLabel}>Service Location</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {user?.address || 'Select address'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>

        {/* Notification Button */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => (navigation.getParent() as any)?.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.TitleColor} />
          {notificationBadge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationBadge}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero Title Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Book a Stylist</Text>
        <Text style={styles.heroSubtitle}>Select a service category to discover top-rated professionals nearby</Text>
      </View>

      {/* Category List */}
      <FlatList
        data={categories}
        keyExtractor={(item, index) => item._id || item.id || `cat_${index}`}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.ButtonPrimaryColor]} />
        }
      />

      <VTLoading visible={loading && !refreshing} />

      {/* Modal: Rate & Review Completed Job */}
      <Modal
        visible={isRatingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.ratingCard}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setIsRatingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingSubtitle}>
              How was your service with {unratedJob?.spName || unratedJob?.worker?.name || 'your hairstylist'}?
            </Text>

            {/* Star Rating Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRatingStars(s)}>
                  <Ionicons
                    name={s <= ratingStars ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Gratuity Tip Options */}
            <Text style={styles.tipLabel}>Add a Tip (Optional)</Text>
            <View style={styles.tipRow}>
              {[0, 3, 5, 10].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.tipBtn, tipAmount === amt && styles.tipBtnActive]}
                  onPress={() => setTipAmount(amt)}
                >
                  <Text style={[styles.tipBtnText, tipAmount === amt && styles.tipBtnTextActive]}>
                    {amt === 0 ? 'No Tip' : `$${amt}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Review Comment */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Leave a comment or feedback for the stylist..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />

            <View style={{ marginTop: 16 }}>
              <VTButton
                title="Submit Review"
                onPress={handleRateSubmit}
                loading={submittingRating}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  locationLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  heroSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.TitleColor,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  listContent: {
    padding: Spacing.base,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginLeft: 14,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  ratingCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  ratingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginVertical: 12,
    lineHeight: 18,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginTop: 10,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tipBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  tipBtnActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
  },
  tipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tipBtnTextActive: {
    color: Colors.ButtonPrimaryColor,
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: Colors.TitleColor,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default CategoriesScreen;
