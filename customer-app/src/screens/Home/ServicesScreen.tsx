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
import { RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { Service } from '../../models';
import { useAuthStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Services'>;
  route: RouteProp<HomeStackParamList, 'Services'>;
};

// Default 4 fallback services if API array is empty
const defaultMainServices: Service[] = [
  {
    id: 'haircuts-1',
    serviceName: 'Haircuts',
    serviceDescription: 'Classic & precision haircuts tailored to your head shape.',
    serviceHourlyRate: 35,
    serviceImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'styled-haircuts-2',
    serviceName: 'Styled Haircuts',
    serviceDescription: 'Custom razor lineups, fades, pompadours & modern styling.',
    serviceHourlyRate: 45,
    serviceImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'group-cuts-3',
    serviceName: 'Group Cuts',
    serviceDescription: 'Family packages, wedding parties & multi-person bookings.',
    serviceHourlyRate: 90,
    serviceImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'addon-services-4',
    serviceName: 'Add-On Services',
    serviceDescription: 'Beard trimming, hot towel shave, hair color & scalp treatment.',
    serviceHourlyRate: 25,
    serviceImage: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
  },
];

const ServicesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceTypeName } = route.params || {};
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: servicesData,
    loading,
    execute: fetchServices,
  } = useApi<any>(JobsApi.fetchServices);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const lat = user?.lastLocation?.latitude || 37.7749;
    const long = user?.lastLocation?.longitude || -122.4194;
    await fetchServices(lat, long);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getServicesArray = (): Service[] => {
    if (Array.isArray(servicesData) && servicesData.length > 0) return servicesData;
    if (servicesData && typeof servicesData === 'object') {
      const obj = servicesData as any;
      if (Array.isArray(obj.services) && obj.services.length > 0) return obj.services;
      if (Array.isArray(obj.data) && obj.data.length > 0) return obj.data;
    }
    return defaultMainServices;
  };

  const rawServicesList = getServicesArray();

  const filteredServices = rawServicesList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.serviceName?.toLowerCase().includes(q) ||
      item.serviceDescription?.toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('SubServices', {
          serviceId: item.id,
          serviceName: item.serviceName,
        })
      }
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {item.serviceImage ? (
          <Image source={{ uri: item.serviceImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="content-cut" size={28} color={Colors.ButtonPrimaryColor} />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.serviceName}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.serviceDescription || 'Professional grooming service.'}
        </Text>
        {item.serviceHourlyRate ? (
          <View style={styles.ratePill}>
            <Text style={styles.rateText}>From ${item.serviceHourlyRate}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.arrowButton}>
        <Ionicons name="arrow-forward" size={18} color={Colors.ButtonPrimaryColor} />
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
        <Text style={styles.title}>{serviceTypeName || 'Select Service'}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
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
          <View style={styles.searchSection}>
            <Text style={styles.sectionLabel}>AVAILABLE SERVICE PACKAGES</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search packages..."
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
          </View>
        }
      />

      <VTLoading visible={loading && !refreshing} />
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
  title: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  searchSection: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 18,
  },
  ratePill: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  rateText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServicesScreen;
