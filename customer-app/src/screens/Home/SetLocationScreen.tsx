import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Button, Input } from '../../components';
import { useJobStore, useAuthStore } from '../../store';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SetLocation'>;
};

const SetLocationScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createJob, setCreateJobField } = useJobStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState(
    createJob.primaryAddress || (typeof user?.permanentAddress === 'string' ? user.permanentAddress : user?.permanentAddress?.primaryAddress) || ''
  );
  const [city, setCity] = useState(
    createJob.city || (typeof user?.permanentAddress === 'object' ? user?.permanentAddress?.city : user?.city) || ''
  );
  const [state, setState] = useState(
    createJob.state || (typeof user?.permanentAddress === 'object' ? user?.permanentAddress?.state : user?.state) || ''
  );
  const [country, setCountry] = useState(
    createJob.country || (typeof user?.permanentAddress === 'object' ? user?.permanentAddress?.country : user?.country) || ''
  );
  const [latitude, setLatitude] = useState(createJob.latitude || 37.7749);
  const [longitude, setLongitude] = useState(createJob.longitude || -122.4194);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Please enable location permissions in your settings',
        });
        setLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geocode && geocode[0]) {
          const place = geocode[0];
          const formattedAddress = [
            place.streetNumber,
            place.street,
            place.subregion,
            place.city,
            place.region,
            place.country,
          ]
            .filter(Boolean)
            .join(', ');

          setAddress(formattedAddress || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
          setCity(place.city || place.subregion || '');
          setState(place.region || '');
          setCountry(place.country || '');
        }
      } catch (geocodeErr) {
        setAddress(`Location (${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)})`);
      }

      Toast.show({
        type: 'success',
        text1: 'Location Detected',
      });
    } catch (error) {
      console.error('Location error:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not fetch current coordinates',
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = () => {
    if (!address.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Address Required',
        text2: 'Please enter a valid appointment address',
      });
      return;
    }

    setCreateJobField('primaryAddress', address);
    setCreateJobField('city', city || 'San Francisco');
    setCreateJobField('state', state || 'CA');
    setCreateJobField('country', country || 'USA');
    setCreateJobField('latitude', latitude);
    setCreateJobField('longitude', longitude);

    Toast.show({
      type: 'success',
      text1: 'Address Saved',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header title="Appointment Location" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Location Action Button */}
        <TouchableOpacity
          style={styles.currentLocationBtn}
          onPress={getCurrentLocation}
          disabled={loadingLocation}
          activeOpacity={0.8}
        >
          <View style={styles.locationIconCircle}>
            {loadingLocation ? (
              <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
            ) : (
              <Ionicons name="navigate" size={20} color={Colors.ButtonPrimaryColor} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.currentLocationTitle}>Use Current Location</Text>
            <Text style={styles.currentLocationSub}>
              {loadingLocation ? 'Detecting coordinates...' : 'Get address from GPS'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Pin On Map Action Button */}
        <TouchableOpacity
          style={styles.mapPickerBtn}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.8}
        >
          <View style={[styles.locationIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="map" size={20} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mapPickerTitle}>Pinpoint on Map</Text>
            <Text style={styles.mapPickerSub}>Select exact location marker interactively</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter details manually</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Address Input Form */}
        <View style={styles.formCard}>
          <Input
            label="Street Address"
            placeholder="e.g. 742 Evergreen Terrace"
            value={address}
            onChangeText={setAddress}
            leftIcon="home-outline"
          />

          <View style={styles.twoColumnRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="City"
                placeholder="e.g. Springfield"
                value={city}
                onChangeText={setCity}
                leftIcon="business-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="State / Province"
                placeholder="e.g. OR"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <Input
            label="Country"
            placeholder="e.g. United States"
            value={country}
            onChangeText={setCountry}
            leftIcon="globe-outline"
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Save & Confirm Location" onPress={handleSave} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.base,
  },
  locationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.ButtonPrimaryColor}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  currentLocationSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  mapPickerTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  mapPickerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: FontWeights.medium,
    paddingHorizontal: 12,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: Spacing.base,
  },
});

export default SetLocationScreen;
