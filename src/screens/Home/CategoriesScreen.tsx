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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { JobsApi, ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { useAuthStore, useUserStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Categories'>;
};

interface ServiceType {
  id: string;
  name: string;
  description: string;
  image?: string;
  serviceTypeName?: string;
}

const CategoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { setNotificationBadge } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: serviceTypes,
    loading,
    error,
    execute: fetchServiceTypes,
  } = useApi<ServiceType[]>(JobsApi.fetchServiceTypes);

  const { execute: fetchNotificationCount } = useApi<any>(ProfileApi.notificationCount);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchServiceTypes();
    const count = await fetchNotificationCount();
    if (count?.notificationCount) {
      setNotificationBadge(count.notificationCount);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleServiceTypePress = (item: ServiceType) => {
    if (item.id === '1' || item.name?.toLowerCase().includes('standard')) {
      navigation.navigate('Services', {
        serviceTypeId: item.id,
        serviceTypeName: item.name,
      });
    } else {
      // Direct booking
      navigation.navigate('UserJobDetail', {
        subServiceId: item.id,
        subServiceName: item.name,
      });
    }
  };

  const renderItem = ({ item }: { item: ServiceType }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleServiceTypePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🎯</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.BGColor} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.getParent() as any)?.openDrawer?.()}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Current Location</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {user?.address || 'Detecting location...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Book a Service</Text>
        <Text style={styles.subtitle}>What service do you need today?</Text>
      </View>

      {/* Service Types List */}
      <FlatList
        data={serviceTypes || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {error || 'No services available'}
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading && !refreshing} />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: FontSizes.xl,
  },
  locationContainer: {
    flex: 1,
    marginHorizontal: Spacing.base,
  },
  locationLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  locationText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: FontSizes.lg,
  },
  titleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  imageContainer: {
    marginRight: Spacing.lg,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.base,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.TextFieldColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FontSizes.xl,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  arrow: {
    fontSize: FontSizes.lg,
    color: Colors.DescriptionTextLight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
});

export default CategoriesScreen;
