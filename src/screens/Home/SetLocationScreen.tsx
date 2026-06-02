import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { useJobStore } from '../../store';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SetLocation'>;
};

const SetLocationScreen: React.FC<Props> = ({ navigation }) => {
  const { setCreateJobField } = useJobStore();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Please enable location permissions in settings',
        });
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocode
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode[0]) {
        const place = geocode[0];
        const formattedAddress = [
          place.street,
          place.streetNumber,
          place.city,
          place.region,
          place.country,
        ]
          .filter(Boolean)
          .join(', ');

        setAddress(formattedAddress);
        setCity(place.city || '');
        setState(place.region || '');
        setCountry(place.country || '');
      }
    } catch (error) {
      console.error('Location error:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not get your current location',
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
        text2: 'Please enter an address',
      });
      return;
    }

    setCreateJobField('primaryAddress', address);
    setCreateJobField('city', city);
    setCreateJobField('state', state);
    setCreateJobField('country', country);
    setCreateJobField('latitude', latitude);
    setCreateJobField('longitude', longitude);

    Toast.show({
      type: 'success',
      text1: 'Location Saved',
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Set Location</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={loadingLocation}
        >
          <Text style={styles.currentLocationIcon}>📍</Text>
          <Text style={styles.currentLocationText}>
            {loadingLocation ? 'Getting location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or enter manually</Text>

        <VTTextField
          label="Address"
          placeholder="Street address"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={2}
        />

        <VTTextField
          label="City"
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />

        <VTTextField
          label="State"
          placeholder="State / Province"
          value={state}
          onChangeText={setState}
        />

        <VTTextField
          label="Country"
          placeholder="Country"
          value={country}
          onChangeText={setCountry}
        />

        <VTButton
          title="Save Location"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.ButtonPrimaryColor}30`,
  },
  currentLocationIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.sm,
  },
  currentLocationText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
  },
  orText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});

export default SetLocationScreen;
