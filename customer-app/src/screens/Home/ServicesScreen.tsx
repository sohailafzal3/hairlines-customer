import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, EmptyState, LoadingOverlay } from '../../components';
import { JobsApi } from '../../api';
import { Service } from '../../models';
import { useAuthStore, useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Services'>;
  route: RouteProp<HomeStackParamList, 'Services'>;
};

const FALLBACK_SERVICES: Service[] = [
  {
    id: 'srv_haircut',
    serviceName: "Men's Standard Haircut",
    serviceDescription: 'Precision clipper and scissor haircut tailored to your preferred style.',
    serviceHourlyRate: 35,
    serviceFixedRate: 35,
    isHourly: false,
    serviceDuration: 30,
    serviceImage: '',
    subServices: [],
    tags: ['haircut', 'fade'],
  },
  {
    id: 'srv_beard',
    serviceName: 'Beard Trim & Shape',
    serviceDescription: 'Line up, shaping, hot towel conditioning, and beard oil application.',
    serviceHourlyRate: 20,
    serviceFixedRate: 20,
    isHourly: false,
    serviceDuration: 20,
    serviceImage: '',
    subServices: [],
    tags: ['beard', 'grooming'],
  },
  {
    id: 'srv_combo',
    serviceName: 'Full Haircut + Beard Combo',
    serviceDescription: 'Complete grooming experience including wash, precision cut, and beard detailing.',
    serviceHourlyRate: 50,
    serviceFixedRate: 50,
    isHourly: false,
    serviceDuration: 45,
    serviceImage: '',
    subServices: [],
    tags: ['combo', 'popular'],
  },
  {
    id: 'srv_lineup',
    serviceName: 'Shape-Up / Edge-Up',
    serviceDescription: 'Crisp hairline perimeter contouring and neck taper.',
    serviceHourlyRate: 15,
    serviceFixedRate: 15,
    isHourly: false,
    serviceDuration: 15,
    serviceImage: '',
    subServices: [],
    tags: ['lineup', 'quick'],
  },
  {
    id: 'srv_kids',
    serviceName: "Kids' Haircut (Under 12)",
    serviceDescription: 'Patient, gentle haircut tailored for young clients.',
    serviceHourlyRate: 25,
    serviceFixedRate: 25,
    isHourly: false,
    serviceDuration: 25,
    serviceImage: '',
    subServices: [],
    tags: ['kids'],
  },
];

const ServicesScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { serviceTypeId, serviceTypeName } = route.params || {};
  const { setCreateJobField } = useJobStore();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadServices();
  }, [serviceTypeId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res: any = await JobsApi.fetchServices(serviceTypeId || '');
      const list = res?.services || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setServices(list);
      } else {
        setServices(FALLBACK_SERVICES);
      }
    } catch (e) {
      console.log('Error fetching services:', e);
      setServices(FALLBACK_SERVICES);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleSelectService = (item: Service) => {
    setCreateJobField('serviceId', item.id);
    setCreateJobField('serviceName', item.serviceName);
    setCreateJobField('servicesName', item.serviceName);
    setCreateJobField('serviceHourlyRate', item.serviceHourlyRate || item.serviceFixedRate || 35);
    setCreateJobField('servicesDescription', item.serviceDescription);

    navigation.navigate('SubServices', {
      serviceId: item.id,
      serviceName: item.serviceName,
    });
  };

  const renderItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleSelectService(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name="cut-outline" size={22} color={Colors.ButtonPrimaryColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.serviceDescription}
          </Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <View style={styles.badgesRow}>
          {item.serviceFixedRate || item.serviceHourlyRate ? (
            <View style={styles.rateBadge}>
              <Text style={styles.rateText}>
                ${item.serviceFixedRate || item.serviceHourlyRate}
                {item.isHourly ? '/hr' : ' fixed'}
              </Text>
            </View>
          ) : null}
          {item.serviceDuration ? (
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={12} color="#64748B" style={{ marginRight: 3 }} />
              <Text style={styles.durationText}>{item.serviceDuration} min</Text>
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header
        title={serviceTypeName || 'Available Services'}
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={services}
        keyExtractor={(item, index) => item.id || `srv_${index}`}
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
              icon="cut-outline"
              title="No services found"
              description="No services available for this category at the moment."
            />
          ) : null
        }
      />

      <LoadingOverlay visible={loading && !refreshing} message="Loading services..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: Spacing.base,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesRow: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  rateBadge: {
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  rateText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: FontWeights.medium,
  },
});

export default ServicesScreen;
