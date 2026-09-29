import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button } from '../../components';
import { useJobStore } from '../../store';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Map'>;
};

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const { createJob, setCreateJobField } = useJobStore();

  const [region, setRegion] = useState({
    latitude: createJob.latitude || 37.7749,
    longitude: createJob.longitude || -122.4194,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  const [selectedAddress, setSelectedAddress] = useState(
    createJob.primaryAddress || 'Selected Map Location'
  );
  const [city, setCity] = useState(createJob.city || 'San Francisco');
  const [state, setState] = useState(createJob.state || 'CA');
  const [country, setCountry] = useState(createJob.country || 'USA');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 800);
        reverseGeocodeCoords(loc.coords.latitude, loc.coords.longitude);
      }
    } catch (e) {
      console.log('Map location fetch error:', e);
    }
  };

  const reverseGeocodeCoords = async (lat: number, lng: number) => {
    try {
      setLoadingAddress(true);
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (results && results[0]) {
        const p = results[0];
        const formatted = [p.streetNumber, p.street, p.subregion, p.city, p.region, p.country]
          .filter(Boolean)
          .join(', ');

        setSelectedAddress(formatted || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setCity(p.city || p.subregion || 'San Francisco');
        setState(p.region || 'CA');
        setCountry(p.country || 'USA');
      } else {
        setSelectedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      setSelectedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setLoadingAddress(false);
    }
  };

  const onRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    reverseGeocodeCoords(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirm = () => {
    setCreateJobField('primaryAddress', selectedAddress);
    setCreateJobField('city', city);
    setCreateJobField('state', state);
    setCreateJobField('country', country);
    setCreateJobField('latitude', region.latitude);
    setCreateJobField('longitude', region.longitude);

    Toast.show({
      type: 'success',
      text1: 'Pin Location Confirmed',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map Component */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Center Fixed Pin */}
      <View style={styles.centerMarkerWrapper} pointerEvents="none">
        <View style={styles.pinBubble}>
          <Ionicons name="cut" size={14} color="#FFFFFF" />
        </View>
        <Ionicons name="location" size={40} color={Colors.ButtonPrimaryColor} style={styles.pinIcon} />
        <View style={styles.pinShadow} />
      </View>

      {/* Floating Top Bar (Back button & Search) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity
          style={styles.floatingRoundBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search address or landmark..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Re-center GPS button */}
      <TouchableOpacity
        style={[styles.recenterBtn, { bottom: Math.max(insets.bottom + 180, 200) }]}
        onPress={fetchCurrentLocation}
        activeOpacity={0.85}
      >
        <Ionicons name="locate" size={22} color={Colors.ButtonPrimaryColor} />
      </TouchableOpacity>

      {/* Bottom Sheet Card */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.addressInfoRow}>
          <View style={styles.addressIconCircle}>
            <Ionicons name="location-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.addressHeading}>Selected Pin Location</Text>
            {loadingAddress ? (
              <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={styles.addressSubtext} numberOfLines={2}>
                {selectedAddress}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Button title="Confirm This Location" onPress={handleConfirm} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    zIndex: 10,
  },
  floatingRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.TitleColor,
    fontWeight: FontWeights.medium,
  },
  centerMarkerWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pinBubble: {
    position: 'absolute',
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  pinIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: -2,
  },
  recenterBtn: {
    position: 'absolute',
    right: Spacing.base,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.base,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressHeading: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  addressSubtext: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginTop: 2,
  },
});

export default MapScreen;
