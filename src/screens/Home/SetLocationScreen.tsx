import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { useJobStore, useUserStore } from '../../store';
import { NewAddress } from '../../models';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SetLocation'>;
  route: RouteProp<HomeStackParamList, 'SetLocation'>;
};

const SetLocationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { createJob, setCreateJobField } = useJobStore();
  const { addresses, setAddresses } = useUserStore();

  // Address Tag (Home or Work)
  const [addressTag, setAddressTag] = useState<'Home' | 'Work'>('Home');

  // Form Section Visibility (Hidden by default unless Add / Edit is tapped)
  const [showForm, setShowForm] = useState(false);

  // Field 1: City / Area / Primary Location
  const [primaryArea, setPrimaryArea] = useState('');
  // Field 2: Street Address, Apartment / Unit #
  const [streetAndUnit, setStreetAndUnit] = useState('');

  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);

  const [loadingLocation, setLoadingLocation] = useState(false);

  // Load saved Home and Work addresses from store
  const homeAddress = addresses.find((a) => a.type === 'Home');
  const workAddress = addresses.find((a) => a.type === 'Work');

  // Listen to params if returning from MapScreen
  useEffect(() => {
    if (route.params?.selectedArea) {
      setPrimaryArea(route.params.selectedArea);
      setShowForm(true);
    }
    if (route.params?.selectedCity) {
      setCity(route.params.selectedCity);
    }
    if (route.params?.selectedState) {
      setState(route.params.selectedState);
    }
    if (route.params?.selectedCountry) {
      setCountry(route.params.selectedCountry);
    }
    if (route.params?.latitude) {
      setLatitude(route.params.latitude);
    }
    if (route.params?.longitude) {
      setLongitude(route.params.longitude);
    }
  }, [
    route.params?.selectedArea,
    route.params?.selectedCity,
    route.params?.selectedState,
    route.params?.selectedCountry,
    route.params?.latitude,
    route.params?.longitude,
  ]);

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
          text2: 'Please enable location permissions in your device settings.',
        });
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocode && geocode[0]) {
        const place = geocode[0];
        
        // Field 1: Area / City / State / Country
        const areaName = [place.name, place.district, place.city, place.region, place.country]
          .filter(Boolean)
          .join(', ');

        // Field 2: Street & House detail
        const streetDetail = [place.streetNumber, place.street]
          .filter(Boolean)
          .join(' ');

        const fullAddr = [streetDetail, areaName].filter(Boolean).join(', ');

        // Instantly set in job store and navigate back
        setCreateJobField('primaryAddress', fullAddr);
        setCreateJobField('streetAddressLine1', streetDetail);
        setCreateJobField('city', place.city || '');
        setCreateJobField('state', place.region || '');
        setCreateJobField('country', place.country || '');
        setCreateJobField('latitude', lat);
        setCreateJobField('longitude', lng);

        Toast.show({
          type: 'success',
          text1: 'Location Detected',
          text2: fullAddr,
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Location error:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not fetch your current GPS position.',
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleOpenMap = () => {
    navigation.navigate('Map', {
      initialLat: latitude || 37.78825,
      initialLng: longitude || -122.4324,
    });
  };

  const handleSelectSavedAddress = (savedAddr: NewAddress) => {
    setCreateJobField('primaryAddress', savedAddr.primaryAddress);
    setCreateJobField('streetAddressLine1', savedAddr.streetAddressLine1 || '');
    setCreateJobField('city', savedAddr.city || '');
    setCreateJobField('state', savedAddr.state || '');
    setCreateJobField('country', savedAddr.country || '');
    setCreateJobField('latitude', savedAddr.latitude || 0);
    setCreateJobField('longitude', savedAddr.longitude || 0);

    Toast.show({
      type: 'success',
      text1: `${savedAddr.type} Address Selected`,
      text2: savedAddr.primaryAddress,
    });
    navigation.goBack();
  };

  const handleStartAddOrEdit = (tag: 'Home' | 'Work', savedAddr?: NewAddress) => {
    setAddressTag(tag);
    setShowForm(true);

    if (savedAddr) {
      setPrimaryArea(savedAddr.primaryAddress || '');
      setStreetAndUnit(savedAddr.streetAddressLine1 || '');
      setCity(savedAddr.city || '');
      setState(savedAddr.state || '');
      setCountry(savedAddr.country || '');
      setLatitude(savedAddr.latitude || 0);
      setLongitude(savedAddr.longitude || 0);
    } else {
      setPrimaryArea('');
      setStreetAndUnit('');
      setCity('');
      setState('');
      setCountry('');
      setLatitude(0);
      setLongitude(0);
    }
  };

  const handleSaveForm = () => {
    if (!primaryArea.trim() && !streetAndUnit.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Address Required',
        text2: 'Please enter a city, area, or street address.',
      });
      return;
    }

    const fullAddress = [streetAndUnit.trim(), primaryArea.trim()]
      .filter(Boolean)
      .join(', ');

    // 1. Update Job Store for booking
    setCreateJobField('primaryAddress', fullAddress);
    setCreateJobField('streetAddressLine1', streetAndUnit.trim());
    setCreateJobField('city', city || 'City');
    setCreateJobField('state', state || 'State');
    setCreateJobField('country', country || 'Country');
    setCreateJobField('latitude', latitude);
    setCreateJobField('longitude', longitude);

    // 2. Persist in User Store (Saved Addresses list)
    const newAddressObj: NewAddress = {
      type: addressTag,
      primaryAddress: fullAddress,
      streetAddressLine1: streetAndUnit.trim(),
      city: city || 'City',
      state: state || 'State',
      country: country || 'Country',
      latitude: latitude || 0,
      longitude: longitude || 0,
    };

    const existingIndex = addresses.findIndex((a) => a.type === addressTag);
    let updatedAddressesList = [...addresses];
    if (existingIndex >= 0) {
      updatedAddressesList[existingIndex] = newAddressObj;
    } else {
      updatedAddressesList.push(newAddressObj);
    }
    setAddresses(updatedAddressesList);

    Toast.show({
      type: 'success',
      text1: 'Address Saved',
      text2: `${addressTag} address saved successfully.`,
    });
    setShowForm(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
            </TouchableOpacity>
            <Text style={styles.title}>Set Location</Text>
            <View style={{ width: 44 }} />
          </View>

          <Text style={styles.subtitle}>
            Select or enter your service location
          </Text>

          {/* Quick Action Options */}
          <View style={styles.actionGrid}>
            {/* Option 1: Use Current Location */}
            <TouchableOpacity
              style={styles.actionCardPrimary}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconContainer}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
                ) : (
                  <Ionicons name="location" size={22} color={Colors.ButtonPrimaryColor} />
                )}
              </View>
              <View style={styles.actionTextWrapper}>
                <Text style={styles.actionTitlePrimary}>
                  {loadingLocation ? 'Detecting Location...' : 'Use Current Location'}
                </Text>
                <Text style={styles.actionSub}>Auto-detect using GPS</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Set Location on Map */}
            <TouchableOpacity
              style={styles.actionCardSecondary}
              onPress={handleOpenMap}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconContainerSec}>
                <Ionicons name="map-outline" size={22} color="#0F172A" />
              </View>
              <View style={styles.actionTextWrapper}>
                <Text style={styles.actionTitleSec}>Set Location on Map</Text>
                <Text style={styles.actionSub}>Pin location on interactive map</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Saved Addresses Section (Home 🏠 & Work 💼) */}
          <View style={styles.savedSection}>
            <Text style={styles.sectionLabel}>Saved Addresses</Text>

            {/* Home Address Card */}
            <View style={styles.savedCard}>
              {homeAddress ? (
                <>
                  <TouchableOpacity
                    style={styles.savedCardMain}
                    onPress={() => handleSelectSavedAddress(homeAddress)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.savedIconCircle}>
                      <Ionicons name="home" size={20} color={Colors.ButtonPrimaryColor} />
                    </View>
                    <View style={styles.savedTextWrapper}>
                      <Text style={styles.savedCardTitle}>Home Address</Text>
                      <Text style={styles.savedCardSub} numberOfLines={1}>
                        {homeAddress.primaryAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.savedCardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleStartAddOrEdit('Home', homeAddress)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.ButtonPrimaryColor} />
                      <Text style={styles.cardActionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={handleOpenMap}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="map-outline" size={16} color="#0F172A" />
                      <Text style={styles.cardActionTextSec}>Map</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => handleStartAddOrEdit('Home')}
                  activeOpacity={0.8}
                >
                  <View style={styles.addIconCircle}>
                    <Ionicons name="add" size={20} color={Colors.ButtonPrimaryColor} />
                  </View>
                  <Text style={styles.addAddressText}>+ Add Home Address</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Work Address Card */}
            <View style={styles.savedCard}>
              {workAddress ? (
                <>
                  <TouchableOpacity
                    style={styles.savedCardMain}
                    onPress={() => handleSelectSavedAddress(workAddress)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.savedIconCircle}>
                      <Ionicons name="briefcase" size={20} color={Colors.ButtonPrimaryColor} />
                    </View>
                    <View style={styles.savedTextWrapper}>
                      <Text style={styles.savedCardTitle}>Work Address</Text>
                      <Text style={styles.savedCardSub} numberOfLines={1}>
                        {workAddress.primaryAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.savedCardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleStartAddOrEdit('Work', workAddress)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.ButtonPrimaryColor} />
                      <Text style={styles.cardActionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={handleOpenMap}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="map-outline" size={16} color="#0F172A" />
                      <Text style={styles.cardActionTextSec}>Map</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => handleStartAddOrEdit('Work')}
                  activeOpacity={0.8}
                >
                  <View style={styles.addIconCircle}>
                    <Ionicons name="add" size={20} color={Colors.ButtonPrimaryColor} />
                  </View>
                  <Text style={styles.addAddressText}>+ Add Work Address</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Enter / Edit Form Section (Hidden by default until Add/Edit is clicked) */}
          {showForm && (
            <View style={styles.formSection}>
              <View style={styles.formHeaderRow}>
                <Text style={styles.sectionLabel}>
                  {`EDIT ${addressTag.toUpperCase()} ADDRESS`}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  style={styles.closeFormButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Tag Selection Chips (Home & Work only) */}
              <View style={styles.tagRow}>
                {[
                  { key: 'Home', label: 'Home 🏠' },
                  { key: 'Work', label: 'Work 💼' },
                ].map((tag) => {
                  const isActive = addressTag === tag.key;
                  return (
                    <TouchableOpacity
                      key={tag.key}
                      style={[styles.tagChip, isActive && styles.tagChipActive]}
                      onPress={() => setAddressTag(tag.key as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tagChipText, isActive && styles.tagChipTextActive]}>
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Field 1: City / Area / Primary Location */}
              <VTTextField
                label="City / Area / Primary Location"
                placeholder="e.g. Downtown, San Francisco, CA"
                value={primaryArea}
                onChangeText={setPrimaryArea}
                leftIcon={<Ionicons name="business-outline" size={18} color="#64748B" />}
              />

              {/* Field 2: Street Address, Apartment / Unit # */}
              <VTTextField
                label="Street Address, Apt / Unit #"
                placeholder="e.g. 123 Market St, Apt 4B"
                value={streetAndUnit}
                onChangeText={setStreetAndUnit}
                leftIcon={<Ionicons name="home-outline" size={18} color="#64748B" />}
              />

              {/* Save Address Button */}
              <VTButton
                title="Save Address"
                onPress={handleSaveForm}
                style={styles.saveButton}
                textStyle={styles.saveButtonText}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginBottom: Spacing.xl,
  },
  actionGrid: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  actionCardPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 45, 99, 0.2)',
  },
  actionCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionIconContainerSec: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitlePrimary: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  actionTitleSec: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  actionSub: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  savedSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  savedCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  savedIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  savedTextWrapper: {
    flex: 1,
  },
  savedCardTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  savedCardSub: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  savedCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActionText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    marginLeft: 4,
  },
  cardActionTextSec: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginLeft: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  addAddressText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  formSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  closeFormButton: {
    padding: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tagChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  tagChipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.uberMoveBold,
  },
  saveButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.lg,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default SetLocationScreen;
