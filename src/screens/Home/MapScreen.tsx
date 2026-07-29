import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '../../theme';
import { VTButton } from '../../components/common';

const MapScreen = ({ navigation, route }: any) => {
  const initialLat = route?.params?.initialLat || 37.78825;
  const initialLng = route?.params?.initialLng || -122.4324;

  const [region, setRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  });

  const [addressText, setAddressText] = useState('Move map to pick location');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    setLoadingAddress(true);

    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });

      if (geocode && geocode[0]) {
        const place = geocode[0];
        const formatted = [place.street, place.name, place.city, place.region, place.country]
          .filter(Boolean)
          .join(', ');
        setAddressText(formatted || 'Selected Location');
        setCity(place.city || '');
        setState(place.region || '');
        setCountry(place.country || '');
      } else {
        setAddressText(`${newRegion.latitude.toFixed(4)}, ${newRegion.longitude.toFixed(4)}`);
      }
    } catch (e) {
      setAddressText('Location on map');
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleConfirm = () => {
    navigation.navigate({
      name: 'SetLocation',
      params: {
        selectedArea: addressText,
        selectedCity: city,
        selectedState: state,
        selectedCountry: country,
        latitude: region.latitude,
        longitude: region.longitude,
      },
      merge: true,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Floating Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pin Location on Map</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="Service Location"
            description={addressText}
          />
        </MapView>

        {/* Fixed Center Pin Overlay */}
        <View pointerEvents="none" style={styles.centerPinContainer}>
          <Ionicons name="location" size={38} color={Colors.ButtonPrimaryColor} />
          <View style={styles.pinShadow} />
        </View>
      </View>

      {/* Bottom Floating Address Card */}
      <View style={styles.bottomCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-sharp" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Selected Map Location</Text>
            {loadingAddress ? (
              <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {addressText}
              </Text>
            )}
          </View>
        </View>

        <VTButton
          title="Confirm Location"
          onPress={handleConfirm}
          style={styles.confirmButton}
          textStyle={styles.confirmButtonText}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -38,
    marginLeft: -19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: -2,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addressLabel: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
  },
  confirmButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default MapScreen;
