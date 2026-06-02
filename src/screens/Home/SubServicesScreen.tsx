import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading, VTButton } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { SubService, SubServiceInfo } from '../../models';
import { useJobStore } from '../../store';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SubServices'>;
  route: RouteProp<HomeStackParamList, 'SubServices'>;
};

const SubServicesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId, serviceName } = route.params;
  const { setCreateJobField } = useJobStore();
  const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);

  const {
    data: subServices,
    loading,
    error,
    execute: fetchSubServices,
  } = useApi<SubService[]>(JobsApi.fetchSubServices);

  useEffect(() => {
    fetchSubServices(serviceId);
  }, [serviceId]);

  const handleSubServicePress = (item: SubService) => {
    setSelectedSubService(item);
    setCreateJobField('serviceId', serviceId);
    setCreateJobField('serviceName', serviceName);
    setCreateJobField('subServiceId', item.id);
    setCreateJobField('subServiceName', item.subServiceName);
  };

  const handleServiceInfoPress = (info: SubServiceInfo) => {
    setCreateJobField('subServiceTypeId', info.id);
    setCreateJobField('subServiceTypeRate', info.duration);
    setCreateJobField('jobDuration', info.duration);
    navigation.navigate('UserJobDetail', {
      subServiceId: selectedSubService?.id || '',
      subServiceName: selectedSubService?.subServiceName || '',
      serviceInfo: info,
    });
  };

  const renderCarouselItem = ({ item }: { item: SubService }) => {
    const isSelected = selectedSubService?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.carouselCard, isSelected && styles.carouselCardActive]}
        onPress={() => handleSubServicePress(item)}
        activeOpacity={0.8}
      >
        {item.subServiceImage ? (
          <Image source={{ uri: item.subServiceImage }} style={styles.carouselImage} />
        ) : (
          <View style={styles.carouselImagePlaceholder}>
            <Text style={styles.carouselPlaceholderText}>🎨</Text>
          </View>
        )}
        <Text style={[styles.carouselTitle, isSelected && styles.carouselTitleActive]} numberOfLines={1}>
          {item.subServiceName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderServiceInfoItem = ({ item }: { item: SubServiceInfo }) => (
    <TouchableOpacity
      style={styles.infoCard}
      onPress={() => handleServiceInfoPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.infoContent}>
        <Text style={styles.infoName}>{item.name}</Text>
        <Text style={styles.infoDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.hasDuration && (
          <Text style={styles.infoDuration}>
            Duration: {item.duration} {item.durationUnit}
          </Text>
        )}
      </View>
      <Text style={styles.infoArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{serviceName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Carousel */}
      <Text style={styles.sectionTitle}>Select a Sub-Service</Text>
      <FlatList
        data={subServices || []}
        keyExtractor={(item) => item.id}
        renderItem={renderCarouselItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      />

      {/* Service Info */}
      {selectedSubService && (
        <>
          <Text style={styles.sectionTitle}>Choose a Plan</Text>
          <FlatList
            data={selectedSubService.serviceInfo}
            keyExtractor={(item) => item.id}
            renderItem={renderServiceInfoItem}
            contentContainerStyle={styles.infoListContent}
          />
        </>
      )}

      {!selectedSubService && subServices && subServices.length > 0 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>👆 Select a sub-service above to see available plans</Text>
        </View>
      )}

      <VTLoading visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  back: {
    fontSize: FontSizes['2xl'],
    color: Colors.TitleColor,
  },
  title: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  carouselContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  carouselCard: {
    width: width * 0.35,
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.CardColor,
    alignItems: 'center',
  },
  carouselCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}08`,
  },
  carouselImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
  },
  carouselImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.TextFieldColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  carouselPlaceholderText: {
    fontSize: FontSizes.xl,
  },
  carouselTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    textAlign: 'center',
  },
  carouselTitleActive: {
    color: Colors.ButtonPrimaryColor,
  },
  infoListContent: {
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  infoContent: {
    flex: 1,
  },
  infoName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  infoDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  infoDuration: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
    marginTop: Spacing.xs,
  },
  infoArrow: {
    fontSize: FontSizes.lg,
    color: Colors.DescriptionTextLight,
  },
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  hintText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    textAlign: 'center',
  },
});

export default SubServicesScreen;
