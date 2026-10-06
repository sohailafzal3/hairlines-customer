import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { kGoogleApiKey } from '../../constants';
import { VTButton } from '../../components/common';
import { useJobStore, useUserStore, useAuthStore } from '../../store';
import { ProfileApi } from '../../api';
import { NewAddress } from '../../models';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SetLocation'>;
  route: RouteProp<HomeStackParamList, 'SetLocation'>;
};

interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  lat?: number;
  lng?: number;
  fullAddress: string;
  city?: string;
  state?: string;
  country?: string;
}

const SetLocationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { createJob, setCreateJob } = useJobStore();
  const { addresses, setAddresses } = useUserStore();
  const { user, isGuest } = useAuthStore();

  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [settingTag, setSettingTag] = useState<'Home' | 'Work' | null>(null);

  // Map state
  const initialLat = createJob.latitude || (user as any)?.latitude || 37.78825;
  const initialLng = createJob.longitude || (user as any)?.longitude || -122.4324;

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
  const [mapAddress, setMapAddress] = useState(createJob.primaryAddress || '');
  const [loadingMapAddress, setLoadingMapAddress] = useState(false);

  // Fetch saved addresses from backend on mount if logged in
  useEffect(() => {
    if (!isGuest) {
      ProfileApi.getAddress()
        .then((res: any) => {
          const list = res?.data?.addresses || res?.addresses || [];
          if (Array.isArray(list) && list.length > 0) {
            setAddresses(list);
          }
        })
        .catch(() => {});
    }
  }, [isGuest]);

  // Load saved Home and Work / Office addresses
  const homeAddress =
    addresses.find((a) => a.type?.toLowerCase() === 'home') ||
    (user?.address || (user as any)?.permanentAddress?.primaryAddress || (user as any)?.residanceAddress?.primaryAddress
      ? {
          primaryAddress:
            user?.address ||
            (user as any)?.permanentAddress?.primaryAddress ||
            (user as any)?.residanceAddress?.primaryAddress,
          streetAddressLine1: (user as any)?.streetAddressLine1 || '',
          type: 'Home',
          latitude: (user as any)?.latitude || 0,
          longitude: (user as any)?.longitude || 0,
          city: user?.city || '',
          state: user?.state || '',
          country: user?.country || '',
        }
      : null);

  const workAddress = addresses.find(
    (a) => a.type?.toLowerCase() === 'work' || a.type?.toLowerCase() === 'office'
  );

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async (query: string) => {
    setSearching(true);
    try {
      // 1. Google Places Autocomplete if API key present
      if (kGoogleApiKey) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
              query
            )}&key=${kGoogleApiKey}`
          );
          const json = await res.json();
          if (json?.predictions && json.predictions.length > 0) {
            const list: SuggestionItem[] = json.predictions.map((p: any) => ({
              id: p.place_id,
              title: p.structured_formatting?.main_text || p.description,
              subtitle: p.structured_formatting?.secondary_text || '',
              fullAddress: p.description,
            }));
            setSuggestions(list);
            setSearching(false);
            return;
          }
        } catch (gErr) {
          console.log('Google Places fallback to geocoding:', gErr);
        }
      }

      // 2. OpenStreetMap Nominatim Autocomplete
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            query
          )}&limit=6`,
          {
            headers: {
              'User-Agent': 'HairlinesCustomerApp/1.0',
            },
          }
        );
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const list: SuggestionItem[] = json.map((item: any, idx: number) => {
            const parts = (item.display_name || '').split(', ');
            const title = parts[0] || item.display_name;
            const subtitle = parts.slice(1).join(', ');
            return {
              id: `${item.place_id || idx}`,
              title,
              subtitle,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              fullAddress: item.display_name,
            };
          });
          setSuggestions(list);
          setSearching(false);
          return;
        }
      } catch (nomErr) {
        console.log('Nominatim fallback to expo-location:', nomErr);
      }

      // 3. Fallback: Native Expo Location Geocoding
      const geoResults = await Location.geocodeAsync(query);
      if (geoResults && geoResults.length > 0) {
        const list: SuggestionItem[] = [];
        for (let i = 0; i < Math.min(geoResults.length, 5); i++) {
          const g = geoResults[i];
          const rev = await Location.reverseGeocodeAsync({
            latitude: g.latitude,
            longitude: g.longitude,
          });
          if (rev && rev[0]) {
            const place = rev[0];
            const title = [place.name, place.streetNumber, place.street].filter(Boolean).join(' ');
            const subtitle = [place.city, place.region, place.country].filter(Boolean).join(', ');
            list.push({
              id: `geo_${i}`,
              title: title || query,
              subtitle: subtitle || '',
              lat: g.latitude,
              lng: g.longitude,
              fullAddress: [title, subtitle].filter(Boolean).join(', '),
              city: place.city || '',
              state: place.region || '',
              country: place.country || '',
            });
          }
        }
        setSuggestions(list);
      }
    } catch (err) {
      console.log('Suggestion error:', err);
    } finally {
      setSearching(false);
    }
  };

  const applySelectedLocation = (data: {
    primaryAddress: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude: number;
    longitude: number;
  }) => {
    // 1. Update active booking store
    setCreateJob({
      primaryAddress: data.primaryAddress,
      streetAddressLine1: data.streetAddress || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      latitude: data.latitude,
      longitude: data.longitude,
    });

    // 2. If user was saving this address as Home or Work, persist it to address store & backend
    if (settingTag) {
      const newAddr: NewAddress = {
        type: settingTag,
        primaryAddress: data.primaryAddress,
        streetAddressLine1: data.streetAddress || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        latitude: data.latitude,
        longitude: data.longitude,
      };

      const filtered = addresses.filter(
        (a) => a.type?.toLowerCase() !== settingTag.toLowerCase()
      );
      setAddresses([...filtered, newAddr]);

      if (!isGuest) {
        ProfileApi.addAddress({
          addressType: settingTag,
          primaryAddress: data.primaryAddress,
          streetAddressLine1: data.streetAddress || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          latitude: data.latitude,
          longitude: data.longitude,
        }).catch((e) => console.log('Save address notice:', e));
      }

      Toast.show({
        type: 'success',
        text1: `${settingTag} Address Saved`,
        text2: data.primaryAddress,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Location Set',
        text2: data.primaryAddress,
      });
    }

    navigation.goBack();
  };

  const handleSelectSuggestion = async (item: SuggestionItem) => {
    let lat = item.lat || 0;
    let lng = item.lng || 0;

    if (!lat || !lng) {
      try {
        const geo = await Location.geocodeAsync(item.fullAddress);
        if (geo && geo[0]) {
          lat = geo[0].latitude;
          lng = geo[0].longitude;
        }
      } catch (e) {
        console.log('Geocoding place error:', e);
      }
    }

    let city = item.city || '';
    let state = item.state || '';
    let country = item.country || '';
    let street = '';

    try {
      if (lat && lng) {
        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (rev && rev[0]) {
          city = rev[0].city || city;
          state = rev[0].region || state;
          country = rev[0].country || country;
          street = [rev[0].streetNumber, rev[0].street].filter(Boolean).join(' ');
        }
      }
    } catch (e) {
      // Ignored
    }

    applySelectedLocation({
      primaryAddress: item.fullAddress || `${item.title}, ${item.subtitle}`,
      streetAddress: street || item.title,
      city,
      state,
      country,
      latitude: lat,
      longitude: lng,
    });
  };

  const handleUseCurrentLocation = async () => {
    setDetectingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Location permission is needed to detect your current position.',
        });
        setDetectingGPS(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (rev && rev[0]) {
        const p = rev[0];
        const street = [p.streetNumber, p.street].filter(Boolean).join(' ');
        const fullAddr = [street, p.district, p.city, p.region, p.country].filter(Boolean).join(', ');

        applySelectedLocation({
          primaryAddress: fullAddr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          streetAddress: street,
          city: p.city || '',
          state: p.region || '',
          country: p.country || '',
          latitude: lat,
          longitude: lng,
        });
      } else {
        applySelectedLocation({
          primaryAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'GPS Error',
        text2: err?.message || 'Could not fetch current GPS location.',
      });
    } finally {
      setDetectingGPS(false);
    }
  };

  // Map Region Change
  const handleMapRegionChange = async (region: Region) => {
    setMapRegion(region);
    setLoadingMapAddress(true);
    try {
      const rev = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      if (rev && rev[0]) {
        const p = rev[0];
        const street = [p.streetNumber, p.street].filter(Boolean).join(' ');
        const fullAddr = [street, p.city, p.region, p.country].filter(Boolean).join(', ');
        setMapAddress(fullAddr || `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`);
      } else {
        setMapAddress(`${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`);
      }
    } catch (e) {
      setMapAddress(`${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`);
    } finally {
      setLoadingMapAddress(false);
    }
  };

  const handleConfirmMapLocation = async () => {
    let city = '';
    let state = '';
    let country = '';
    let street = '';

    try {
      const rev = await Location.reverseGeocodeAsync({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
      });
      if (rev && rev[0]) {
        const p = rev[0];
        city = p.city || '';
        state = p.region || '';
        country = p.country || '';
        street = [p.streetNumber, p.street].filter(Boolean).join(' ');
      }
    } catch (e) {
      // Ignored
    }

    applySelectedLocation({
      primaryAddress: mapAddress || `${mapRegion.latitude.toFixed(4)}, ${mapRegion.longitude.toFixed(4)}`,
      streetAddress: street,
      city,
      state,
      country,
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    });
  };

  const handleSelectSavedAddress = (saved: any, defaultType: 'Home' | 'Work') => {
    if (saved && saved.primaryAddress) {
      applySelectedLocation({
        primaryAddress: saved.primaryAddress,
        streetAddress: saved.streetAddressLine1 || '',
        city: saved.city || '',
        state: saved.state || '',
        country: saved.country || '',
        latitude: saved.latitude || 0,
        longitude: saved.longitude || 0,
      });
    } else {
      setSettingTag(defaultType);
      setSearchQuery('');
      Toast.show({
        type: 'info',
        text1: `Set ${defaultType} Address`,
        text2: `Search your address below or use GPS / Map to save your ${defaultType} location.`,
      });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (showMapPicker) {
              setShowMapPicker(false);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{showMapPicker ? 'Pin on Map' : 'Set Location'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!showMapPicker ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Active Tag Indicator if user clicked to set Home / Work */}
          {settingTag && (
            <View style={styles.activeTagBanner}>
              <Ionicons
                name={settingTag === 'Home' ? 'home' : 'briefcase'}
                size={16}
                color={Colors.ButtonPrimaryColor}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.activeTagText}>
                Setting your <Text style={{ fontWeight: '700' }}>{settingTag}</Text> address
              </Text>
              <TouchableOpacity
                onPress={() => setSettingTag(null)}
                style={styles.cancelTagButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Search Input Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={
                settingTag
                  ? `Search for your ${settingTag} address...`
                  : 'Search address, city, or place...'
              }
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searching && <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />}
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            {/* GPS Button */}
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={handleUseCurrentLocation}
              disabled={detectingGPS}
              activeOpacity={0.85}
            >
              {detectingGPS ? (
                <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
              ) : (
                <Ionicons name="locate" size={20} color={Colors.ButtonPrimaryColor} />
              )}
              <Text style={styles.actionTextPrimary}>
                {detectingGPS ? 'Detecting GPS...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            {/* Map Button */}
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => setShowMapPicker(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={20} color="#0F172A" />
              <Text style={styles.actionTextSecondary}>Pick on Map</Text>
            </TouchableOpacity>
          </View>

          {/* Suggestions List OR Saved Places Suggestions */}
          <View style={styles.contentContainer}>
            {suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIconCircle}>
                      <Ionicons name="location-outline" size={20} color={Colors.ButtonPrimaryColor} />
                    </View>
                    <View style={styles.suggestionTextWrapper}>
                      <Text style={styles.suggestionTitle}>{item.title}</Text>
                      {!!item.subtitle && (
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              />
            ) : searchQuery.length > 0 ? (
              <View style={styles.emptyPrompt}>
                <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyPromptTitle}>No matching addresses</Text>
                <Text style={styles.emptyPromptSub}>Try searching with street number, city, or area name.</Text>
              </View>
            ) : (
              /* Saved Address Suggestions: Home & Office */
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg }}>
                <Text style={styles.savedSectionHeader}>SAVED PLACES & SUGGESTIONS</Text>

                {/* Home Address Card */}
                <TouchableOpacity
                  style={styles.savedCard}
                  onPress={() => handleSelectSavedAddress(homeAddress, 'Home')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.savedIconCircle, { backgroundColor: '#EEF4FF' }]}>
                    <Ionicons name="home" size={20} color={Colors.ButtonPrimaryColor} />
                  </View>
                  <View style={styles.savedTextWrapper}>
                    <View style={styles.savedTitleRow}>
                      <Text style={styles.savedTitle}>Home</Text>
                      {homeAddress?.primaryAddress ? (
                        <View style={styles.savedTagBadge}>
                          <Text style={styles.savedTagBadgeText}>SAVED</Text>
                        </View>
                      ) : (
                        <View style={styles.addTagBadge}>
                          <Text style={styles.addTagBadgeText}>+ SET ADDRESS</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.savedSubtitle} numberOfLines={1}>
                      {homeAddress?.primaryAddress || 'Tap to set and save your Home address'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                {/* Office / Work Address Card */}
                <TouchableOpacity
                  style={styles.savedCard}
                  onPress={() => handleSelectSavedAddress(workAddress, 'Work')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.savedIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="briefcase" size={20} color="#D97706" />
                  </View>
                  <View style={styles.savedTextWrapper}>
                    <View style={styles.savedTitleRow}>
                      <Text style={styles.savedTitle}>Office / Work</Text>
                      {workAddress?.primaryAddress ? (
                        <View style={styles.savedTagBadge}>
                          <Text style={styles.savedTagBadgeText}>SAVED</Text>
                        </View>
                      ) : (
                        <View style={styles.addTagBadge}>
                          <Text style={styles.addTagBadgeText}>+ SET ADDRESS</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.savedSubtitle} numberOfLines={1}>
                      {workAddress?.primaryAddress || 'Tap to set and save your Work/Office address'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                {/* Helpful Instruction Tip */}
                <View style={styles.tipCard}>
                  <Ionicons name="information-circle-outline" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
                  <Text style={styles.tipText}>
                    Select an address above or search for any location to see stylists available in your area.
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* Map View Screen */
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={mapRegion}
            onRegionChangeComplete={handleMapRegionChange}
          >
            <Marker
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              title="Service Address"
            />
          </MapView>

          {/* Center Pin */}
          <View pointerEvents="none" style={styles.mapCenterPin}>
            <Ionicons name="location" size={42} color={Colors.ButtonPrimaryColor} />
          </View>

          {/* Bottom Card */}
          <View style={styles.mapBottomCard}>
            <View style={styles.mapAddressRow}>
              <Ionicons name="location-sharp" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.mapAddressLabel}>SELECTED PIN LOCATION</Text>
                {loadingMapAddress ? (
                  <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                ) : (
                  <Text style={styles.mapAddressValue} numberOfLines={2}>
                    {mapAddress || 'Move map to pinpoint location'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.mapButtonRow}>
              <TouchableOpacity
                style={styles.mapCancelBtn}
                onPress={() => setShowMapPicker(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.mapCancelBtnText}>Back</Text>
              </TouchableOpacity>

              <VTButton
                title="Confirm Location"
                onPress={handleConfirmMapLocation}
                style={styles.mapConfirmBtn}
              />
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: Spacing.xl,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  activeTagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.15)',
  },
  activeTagText: {
    flex: 1,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.ButtonPrimaryColor,
  },
  cancelTagButton: {
    padding: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    height: 52,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveMedium,
    color: '#0F172A',
    paddingVertical: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.15)',
    gap: 6,
  },
  actionTextPrimary: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  actionTextSecondary: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  suggestionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  suggestionTextWrapper: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  savedSectionHeader: {
    fontSize: 11,
    fontFamily: Fonts.uberMoveBold,
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.md,
  },
  savedIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  savedTextWrapper: {
    flex: 1,
  },
  savedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  savedTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  savedTagBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  savedTagBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.uberMoveBold,
    color: '#15803D',
  },
  addTagBadge: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  addTagBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  savedSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.ButtonPrimaryColor,
    lineHeight: 18,
  },
  emptyPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  emptyPromptTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyPromptSub: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapCenterPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -42,
    marginLeft: -21,
  },
  mapBottomCard: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  mapAddressLabel: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  mapAddressValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginTop: 2,
  },
  mapButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  mapCancelBtn: {
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  mapCancelBtnText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
  },
  mapConfirmBtn: {
    flex: 1,
  },
});

export default SetLocationScreen;
