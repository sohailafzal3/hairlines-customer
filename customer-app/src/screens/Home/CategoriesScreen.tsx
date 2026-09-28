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
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi, ProfileApi } from '../../api';
import { useAuthStore, useUserStore, useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Categories'>;
};

interface ServiceCategory {
  _id?: string;
  id?: string;
  serviceName?: string;
  name?: string;
  serviceDescription?: string;
  description?: string;
  serviceImage?: string;
  image?: string;
  subServices?: any[];
}

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat_barber',
    name: "Men's Haircut & Grooming",
    description: 'Fades, scissor cuts, beard styling, hot towel shave & facial grooming',
  },
  {
    id: 'cat_salon',
    name: "Women's Styling & Hair Care",
    description: 'Blowouts, precision haircuts, coloring, keratin treatment & styling',
  },
  {
    id: 'cat_braids',
    name: 'Braids & Natural Hair',
    description: 'Box braids, dreadlocks, cornrows, twists, weaves & scalp therapy',
  },
  {
    id: 'cat_cleaning',
    name: 'Premise & Home Cleaning',
    description: 'Standard home, deep clean, move-out & office sanitization',
  },
];

const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { notificationBadge, setNotificationBadge } = useUserStore();
  const { setCreateJobField } = useJobStore();

  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Unrated Job Rating Modal State
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
      const lat = user?.lastLocation?.latitude || 37.7749;
      const lng = user?.lastLocation?.longitude || -122.4194;

      let list: any[] = [];
      try {
        const res = await JobsApi.fetchServices(lat, lng);
        const fetched = (res as any)?.services || (res as any)?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(fetched) && fetched.length > 0) list = fetched;
      } catch (err) {}

      if (list.length === 0) {
        try {
          const resTypes = await JobsApi.fetchServiceTypes();
          const fetchedTypes = (resTypes as any)?.serviceTypes || (resTypes as any)?.data || (Array.isArray(resTypes) ? resTypes : []);
          if (Array.isArray(fetchedTypes) && fetchedTypes.length > 0) list = fetchedTypes;
        } catch (err) {}
      }

      if (list.length > 0) {
        setCategories(list);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      try {
        const countRes: any = await ProfileApi.notificationCount();
        if (countRes?.notificationCount !== undefined) {
          setNotificationBadge(countRes.notificationCount);
        }
      } catch (cntErr) {}
    } catch (e) {
      console.log('Categories load error:', e);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const checkUnratedJob = async () => {
    try {
      const res: any = await JobsApi.lastUnratedJob();
      const jobData = res?.job || res?.data || res;
      if (jobData && (jobData._id || jobData.jobId)) {
        setUnratedJob(jobData);
        setIsRatingModalVisible(true);
      }
    } catch (e) {}
  };

  const handleRateSubmit = async () => {
    if (!unratedJob) return;
    try {
      setSubmittingRating(true);
      const jId = unratedJob._id || unratedJob.jobId || '';
      const spId = unratedJob.spProfileId || unratedJob.worker?.id || unratedJob.spId || '';
      await JobsApi.rateSP({
        jobId: jId,
        spProfileId: spId,
        rating: ratingStars,
        review: reviewText.trim(),
        gratuity: tipAmount,
      });
      setIsRatingModalVisible(false);
      setUnratedJob(null);
      Alert.alert('Thank you!', 'Your review and rating have been submitted.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await checkUnratedJob();
    setRefreshing(false);
  };

  const handleSelectCategory = (item: ServiceCategory) => {
    const sId = item._id || item.id || '';
    const sName = item.serviceName || item.name || 'Services';
    setCreateJobField('serviceId', sId);
    setCreateJobField('serviceName', sName);

    navigation.navigate('Services', {
      serviceTypeId: sId,
      serviceTypeName: sName,
    });
  };

  const renderItem = ({ item }: { item: ServiceCategory }) => {
    const title = item.serviceName || item.name || 'Hair & Grooming';
    const description = item.serviceDescription || item.description || 'Professional on-demand services';
    const imageUri = item.serviceImage || item.image;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectCategory(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.catImage} />
            ) : (
              <MaterialCommunityIcons name="content-cut" size={24} color="#FFFFFF" />
            )}
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.getParent() as any)?.openDrawer?.()}
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
        contentContainerStyle={styles.listContent}
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
    minWidth: 16,
    height: 16,
    borderRadius: 8,
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.TitleColor,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 20,
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  card: {
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
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    marginLeft: 14,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  tipBtnActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}12`,
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
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 14,
    color: Colors.TitleColor,
    textAlignVertical: 'top',
    height: 80,
  },
});

export default CategoriesScreen;
