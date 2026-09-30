import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
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
import { SubService, SubServiceInfo } from '../../models';
import { useJobStore } from '../../store';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SubServices'>;
  route: RouteProp<HomeStackParamList, 'SubServices'>;
};

const FALLBACK_SUBSERVICES: SubService[] = [
  {
    id: 'sub_classic',
    subServiceName: 'Classic Cut',
    subServiceDescription: 'Standard precision cut with warm towel neck shave',
    subServiceImage: '',
    serviceInfo: [
      {
        id: 'info_std',
        name: 'Standard Treatment (30 mins)',
        description: 'Includes consultation, hair wash, cut, and light styling.',
        hasDuration: true,
        duration: 30,
        durationUnit: 'min',
      },
      {
        id: 'info_deluxe',
        name: 'Deluxe Treatment (45 mins)',
        description: 'Includes hot towel steam, scalp massage, precision cut, and premium pomade styling.',
        hasDuration: true,
        duration: 45,
        durationUnit: 'min',
      },
    ],
  },
  {
    id: 'sub_fade',
    subServiceName: 'Skin Fade & Taper',
    subServiceDescription: 'High/low/mid fade blended to perfection',
    subServiceImage: '',
    serviceInfo: [
      {
        id: 'info_fade',
        name: 'Full Skin Fade (45 mins)',
        description: 'Zero foil razor blend with crisp perimeter shape-up.',
        hasDuration: true,
        duration: 45,
        durationUnit: 'min',
      },
    ],
  },
  {
    id: 'sub_beard',
    subServiceName: 'Beard Sculpt & Treatment',
    subServiceDescription: 'Hot steam towel, razor edging and beard oils',
    subServiceImage: '',
    serviceInfo: [
      {
        id: 'info_beard',
        name: 'Beard Sculpt Session (30 mins)',
        description: 'Conditioning steam treatment and razor edge line-up.',
        hasDuration: true,
        duration: 30,
        durationUnit: 'min',
      },
    ],
  },
];

const SubServicesScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { serviceId, serviceName } = route.params;
  const { setCreateJobField } = useJobStore();

  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubServices();
  }, [serviceId]);

  const loadSubServices = async () => {
    try {
      setLoading(true);
      const res: any = await JobsApi.fetchSubServices(serviceId);
      const list =
        res?.subServices ||
        res?.subServicesList ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        const mapped: SubService[] = list.map((item: any) => {
          const rawInfos = item.subServiceInfo || item.subServicesTypes || [];
          const serviceInfo: SubServiceInfo[] =
            Array.isArray(rawInfos) && rawInfos.length > 0
              ? rawInfos.map((info: any) => ({
                  id: info._id || info.id,
                  name: info.name || 'Standard Treatment',
                  description: info.description || '',
                  duration: info.duration || 30,
                  hasDuration: info.hasDuration ?? true,
                  durationUnit: info.durationUnit || 'min',
                  subServiceId: info.subServiceId || item._id || item.id,
                }))
              : [
                  {
                    id: `${item._id || item.id}_std`,
                    name: 'Standard Treatment (30 mins)',
                    description: item.subServiceDescription || 'Precision cut and styling.',
                    duration: 30,
                    hasDuration: true,
                    durationUnit: 'min',
                    subServiceId: item._id || item.id,
                  },
                ];

          return {
            id: item._id || item.id,
            subServiceName: item.subServiceName || item.name || 'Grooming Style',
            subServiceDescription: item.subServiceDescription || item.description || '',
            subServiceImage: item.subServiceImage || item.image || '',
            serviceId: item.serviceId || serviceId,
            serviceInfo,
          };
        });
        setSubServices(mapped);
        setSelectedSubService(mapped[0]);
      } else {
        setSubServices(FALLBACK_SUBSERVICES);
        setSelectedSubService(FALLBACK_SUBSERVICES[0]);
      }
    } catch (e) {
      console.log('Error fetching sub services:', e);
      setSubServices(FALLBACK_SUBSERVICES);
      setSelectedSubService(FALLBACK_SUBSERVICES[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubService = (item: SubService) => {
    setSelectedSubService(item);
  };

  const handleSelectPackage = (info: SubServiceInfo) => {
    if (!selectedSubService) return;

    setCreateJobField('subServiceId', selectedSubService.id);
    setCreateJobField('subServiceName', selectedSubService.subServiceName);
    setCreateJobField('subServiceTypeId', info.id);
    setCreateJobField('serviceTypeName', info.name);
    setCreateJobField('serviceTypeDescription', info.description);
    setCreateJobField('jobDuration', info.duration || 30);

    navigation.navigate('UserJobDetail', {
      subServiceId: selectedSubService.id,
      subServiceName: selectedSubService.subServiceName,
      serviceInfo: info,
    });
  };

  const renderCarouselItem = ({ item }: { item: SubService }) => {
    const isSelected = selectedSubService?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.carouselCard, isSelected && styles.carouselCardSelected]}
        onPress={() => handleSelectSubService(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.cardIconWrapper, isSelected && styles.cardIconWrapperSelected]}>
          <Ionicons
            name="cut"
            size={24}
            color={isSelected ? '#FFFFFF' : Colors.ButtonPrimaryColor}
          />
        </View>

        <Text
          style={[styles.carouselTitle, isSelected && styles.carouselTitleSelected]}
          numberOfLines={1}
        >
          {item.subServiceName}
        </Text>

        <Text
          style={[styles.carouselDesc, isSelected && styles.carouselDescSelected]}
          numberOfLines={2}
        >
          {item.subServiceDescription || item.serviceDescription || 'Precision styling and finish'}
        </Text>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.selectedBadgeText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderServiceInfoItem = ({ item }: { item: SubServiceInfo }) => (
    <TouchableOpacity
      style={styles.packageCard}
      onPress={() => handleSelectPackage(item)}
      activeOpacity={0.85}
    >
      <View style={styles.packageHeader}>
        <View style={styles.packageTitleRow}>
          <Text style={styles.packageName}>{item.name}</Text>
        </View>
        {item.duration ? (
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.durationPillText}>
              {item.duration} {item.durationUnit || 'mins'}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.packageDescription}>{item.description}</Text>

      <View style={styles.packageFooter}>
        <View style={styles.priceRow}>
          <Text style={styles.startingAtText}>Package includes custom consultation</Text>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={16} color={Colors.ButtonPrimaryColor} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header title={serviceName} onBackPress={() => navigation.goBack()} />

      <FlatList
        data={selectedSubService?.serviceInfo || []}
        keyExtractor={(item, index) => item.id || `plan_${index}`}
        renderItem={renderServiceInfoItem}
        contentContainerStyle={[styles.infoListContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Carousel Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>1. Select Style / Sub-Service</Text>
            </View>
            <FlatList
              data={subServices}
              keyExtractor={(item, index) => item.id || `sub_${index}`}
              renderItem={renderCarouselItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            />

            {/* Plans Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>2. Choose Treatment Plan</Text>
              <Text style={styles.sectionSubtitle}>Select package duration and specific service details</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="calendar-outline"
              title="No packages found"
              description="Please select a different sub-service above."
            />
          ) : null
        }
      />

      <LoadingOverlay visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  sectionHeaderRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  carouselContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.xs,
  },
  carouselCard: {
    width: width * 0.58,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  carouselCardSelected: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#F8FAFC',
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.ButtonPrimaryColor}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardIconWrapperSelected: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  carouselTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 4,
  },
  carouselTitleSelected: {
    color: Colors.ButtonPrimaryColor,
  },
  carouselDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  carouselDescSelected: {
    color: '#475569',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.ButtonPrimaryColor}14`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginLeft: 4,
  },
  infoListContent: {
    paddingHorizontal: Spacing.base,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packageTitleRow: {
    flex: 1,
    marginRight: 8,
  },
  packageName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: '#059669',
  },
  packageDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  priceRow: {
    flex: 1,
  },
  startingAtText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: FontWeights.medium,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubServicesScreen;
