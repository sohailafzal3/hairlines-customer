import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { SubService, SubServiceInfo } from '../../models';
import { useJobStore } from '../../store';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SubServices'>;
  route: RouteProp<HomeStackParamList, 'SubServices'>;
};

interface HaircutStyleSlide {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  durationUnit: string;
  price: number;
  image: string;
}

// Full screen haircut style options with high quality images and detailed paragraphs
const defaultHaircutStyles: HaircutStyleSlide[] = [
  {
    id: 'style-1',
    name: 'Classic Taper Fade',
    category: 'Haircuts',
    description: 'A timeless haircut featuring smooth gradual fading along the sides and back, leaving natural length on top. Blends seamlessly into all beard lengths for a sharp, executive look.',
    duration: 30,
    durationUnit: 'mins',
    price: 35,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'style-2',
    name: 'Textured Modern Crop',
    category: 'Styled Haircuts',
    description: 'A contemporary textured top cut with a skin drop fade and razor edge blunt fringe. Styled with matte clay for volume and natural movement.',
    duration: 40,
    durationUnit: 'mins',
    price: 45,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'style-3',
    name: 'Executive Pompadour',
    category: 'Styled Haircuts',
    description: 'High-volume swept back style paired with clean medium skin fade. Perfect for professional business environments and formal occasions.',
    duration: 45,
    durationUnit: 'mins',
    price: 50,
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'style-4',
    name: 'Buzz Cut & Sharp Lineup',
    category: 'Haircuts',
    description: 'Ultra-clean uniform short buzz cut finished with razor-sharp hairline lineup and temple tape. Low maintenance and always fresh.',
    duration: 25,
    durationUnit: 'mins',
    price: 30,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'style-5',
    name: 'Beard Sculpt & Razor Shave',
    category: 'Add-On Services',
    description: 'Full hot towel treatment with precision beard shaping, straight razor edge detailing, and organic beard oil hydration.',
    duration: 30,
    durationUnit: 'mins',
    price: 30,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
  },
];

const SubServicesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId, serviceName } = route.params || {};
  const { setCreateJobField } = useJobStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    data: rawSubServices,
    loading,
    execute: fetchSubServices,
  } = useApi<any>(JobsApi.fetchSubServices);

  useEffect(() => {
    if (serviceId) {
      fetchSubServices(serviceId);
    }
  }, [serviceId]);

  const handleSelectStyle = (style: HaircutStyleSlide) => {
    setCreateJobField('serviceId', serviceId || '1');
    setCreateJobField('serviceName', serviceName || style.category);
    setCreateJobField('subServiceId', style.id);
    setCreateJobField('subServiceName', style.name);
    setCreateJobField('subServiceTypeId', style.id);
    setCreateJobField('jobDuration', style.duration);

    const info: SubServiceInfo = {
      id: style.id,
      name: style.name,
      description: style.description,
      duration: style.duration,
      durationUnit: style.durationUnit,
      hasDuration: true,
    };

    navigation.navigate('UserJobDetail', {
      subServiceId: style.id,
      subServiceName: style.name,
      serviceInfo: info,
    });
  };

  const renderStyleSlide = ({ item, index }: { item: HaircutStyleSlide; index: number }) => (
    <View style={styles.slideCard}>
      {/* Large High Quality Style Image */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>${item.price}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.durationBadgeText}>{item.duration} {item.durationUnit}</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.slideDetails}>
        <Text style={styles.slideHeaderTitle}>{item.name}</Text>
        <Text style={styles.slideCategory}>{item.category.toUpperCase()}</Text>

        <Text style={styles.slideParagraph}>{item.description}</Text>

        <VTButton
          title="Select This Style →"
          onPress={() => handleSelectStyle(item)}
          style={styles.selectButton}
          textStyle={styles.selectButtonText}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{serviceName || 'Choose Haircut Style'}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Full Screen Carousel Slider */}
      <FlatList
        data={defaultHaircutStyles}
        keyExtractor={(item) => item.id}
        renderItem={renderStyleSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(newIndex);
        }}
      />

      {/* Slider Indicators */}
      <View style={styles.indicatorRow}>
        {defaultHaircutStyles.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.indicatorDot,
              idx === activeIndex && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>

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
  slideCard: {
    width: width,
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  imageWrapper: {
    width: '100%',
    height: height * 0.42,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  priceBadgeText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  slideDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    justifyContent: 'space-between',
  },
  slideHeaderTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  slideCategory: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  slideParagraph: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#475569',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  selectButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
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
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  indicatorDotActive: {
    width: 24,
    backgroundColor: Colors.ButtonPrimaryColor,
  },
});

export default SubServicesScreen;
