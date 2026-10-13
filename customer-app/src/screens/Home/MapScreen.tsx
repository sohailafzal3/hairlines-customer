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
import { useTheme } from '../../context/ThemeContext';

const MapScreen = ({ navigation, route }: any) => {
  const { primaryColor } = useTheme();
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
          <Ionicons name="arrow-back" size={22} color={primaryColor} />
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
            pinColor={primaryColor}
          />
        </MapView>

        {/* Fixed Center Teardrop Pin Overlay */}
        <View pointerEvents="none" style={styles.centerPinContainer}>
          <View style={styles.teardropMarkerWrap}>
            <View style={[styles.teardropHead, { backgroundColor: primaryColor }]}>
              <View style={styles.teardropInnerCircle}>
                <Ionicons name="cut" size={15} color={primaryColor} />
              </View>
            </View>
            <View style={[styles.teardropPointer, { borderTopColor: primaryColor }]} />
            <View style={styles.teardropGroundShadow} />
          </View>
        </View>
      </View>

      {/* Bottom Floating Address Card */}
      <View style={styles.bottomCard}>
        <View style={styles.addressHeader}>
          <Ionicons name="location-sharp" size={20} color={primaryColor} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Selected Map Location</Text>
            {loadingAddress ? (
              <ActivityIndicator size="small" color={primaryColor} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
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
    marginTop: -26,
    marginLeft: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teardropMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 52,
  },
  teardropHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 6,
  },
  teardropInnerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teardropPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },
  teardropGroundShadow: {
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    alignSelf: 'center',
    marginTop: 1,
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
