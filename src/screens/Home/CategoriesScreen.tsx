import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAuthStore, useUserStore, useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Categories'>;
};

interface ServiceCategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
}

// 4 Required Categories ALWAYS displayed on Book a Service screen when location is set
const categoriesList: ServiceCategoryItem[] = [
  {
    id: 'haircuts-1',
    name: 'Haircuts',
    description: 'Classic & precision haircuts tailored to your head shape.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'styled-haircuts-2',
    name: 'Styled Haircuts',
    description: 'Custom razor lineups, fades, pompadours & modern styling.',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'group-cuts-3',
    name: 'Group Cuts',
    description: 'Family packages, wedding parties & multi-person bookings.',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'addon-services-4',
    name: 'Add-On Services',
    description: 'Beard trimming, hot towel shave, hair color & scalp treatment.',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
  },
];

const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { user, account, isGuest } = useAuthStore();
  const { notificationBadge } = useUserStore();
  const { createJob, setCreateJobField } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState('Set your location');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    if (user?.address || createJob?.primaryAddress) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDetectedLocation('Set your location');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode && geocode[0]) {
        const place = geocode[0];
        const formattedAddress = [
          place.street,
          place.streetNumber,
          place.city,
          place.region,
          place.country,
        ]
          .filter(Boolean)
          .join(', ');
        setDetectedLocation(formattedAddress);
        setCreateJobField('primaryAddress', formattedAddress);
        setCreateJobField('city', place.city || '');
        setCreateJobField('state', place.region || '');
        setCreateJobField('country', place.country || '');
        setCreateJobField('latitude', location.coords.latitude);
        setCreateJobField('longitude', location.coords.longitude);
      } else {
        setDetectedLocation('Set your location');
      }
    } catch (e) {
      setDetectedLocation('Set your location');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCategoryPress = (item: ServiceCategoryItem) => {
    navigation.navigate('SubServices', {
      serviceId: item.id,
      serviceName: item.name,
    });
  };

  const hasLocationPicked = Boolean(
    createJob?.primaryAddress ||
      user?.address ||
      (detectedLocation &&
        detectedLocation !== 'Set your location' &&
        detectedLocation !== 'Detecting location...')
  );

  const filteredServices = categoriesList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const currentLocationText =
    createJob?.primaryAddress || user?.address || detectedLocation;

  const getUserGreetingName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.name) return user.name.split(' ')[0];
    if (account?.firstName) return account.firstName;
    if (account?.name) return account.name.split(' ')[0];
    if (isGuest) return 'Guest';
    return 'Customer';
  };

  const renderItem = ({ item }: { item: ServiceCategoryItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="content-cut" size={28} color={Colors.ButtonPrimaryColor} />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.arrowButton}>
        <Ionicons name="arrow-forward" size={18} color={Colors.ButtonPrimaryColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.getParent() as any)?.openDrawer?.()}
          style={styles.headerButton}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>

        {/* Location Picker Pill */}
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => navigation.navigate('SetLocation')}
          activeOpacity={0.8}
        >
          <Ionicons name="location-sharp" size={16} color={Colors.ButtonPrimaryColor} style={{ marginRight: 6 }} />
          <View style={styles.locationTextWrapper}>
            <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {currentLocationText}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Notification Button */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('Notifications' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          {notificationBadge > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <FlatList
        data={hasLocationPicked ? filteredServices : []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.ButtonPrimaryColor]}
            tintColor={Colors.ButtonPrimaryColor}
          />
        }
        ListHeaderComponent={
          <View style={styles.heroSection}>
            {/* Greeting */}
            <Text style={styles.greetingText}>
              Hello, {getUserGreetingName()} 👋
            </Text>
            <Text style={styles.heroTitle}>What service do you need today?</Text>

            {/* Quick Search Bar */}
            {hasLocationPicked && (
              <View style={styles.searchBarContainer}>
                <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search services (e.g. Haircuts, Fade)..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {hasLocationPicked && <Text style={styles.sectionTitle}>SELECT A SERVICE</Text>}
          </View>
        }
        ListEmptyComponent={
          !hasLocationPicked ? (
            <View style={styles.locationRequiredCard}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location-sharp" size={32} color={Colors.ButtonPrimaryColor} />
              </View>
              <Text style={styles.locationRequiredTitle}>Set Location to View Services</Text>
              <Text style={styles.locationRequiredSub}>
                Please select your location to view available haircuts, styling, and grooming services near you.
              </Text>
              <TouchableOpacity
                style={styles.setLocationButton}
                onPress={() => navigation.navigate('SetLocation')}
                activeOpacity={0.85}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.setLocationButtonText}>Select Service Location</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  heroSection: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  greetingText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: FontSizes['2xl'] + 2,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    letterSpacing: 0.2,
    marginBottom: Spacing.lg,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    marginRight: Spacing.lg,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 18,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRequiredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  locationRequiredTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  locationRequiredSub: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  setLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  setLocationButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default CategoriesScreen;
