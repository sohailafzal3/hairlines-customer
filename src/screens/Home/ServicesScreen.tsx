import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
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

const ServicesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceTypeName } = route.params;
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: services,
    loading,
    error,
    execute: fetchServices,
  } = useApi<Service[]>(JobsApi.fetchServices);

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

  const renderItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('SubServices', {
          serviceId: item.id,
          serviceName: item.serviceName,
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {item.serviceImage ? (
          <Image source={{ uri: item.serviceImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🛠</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.serviceName}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.serviceDescription}
        </Text>
        {item.serviceHourlyRate ? (
          <Text style={styles.rateText}>
            ${item.serviceHourlyRate}/hr
          </Text>
        ) : null}
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{serviceTypeName || 'Services'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={services || []}
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
  rateText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
    marginTop: Spacing.xs,
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

export default ServicesScreen;
