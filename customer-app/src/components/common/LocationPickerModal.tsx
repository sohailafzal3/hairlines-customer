import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { kGoogleApiKey } from '../../constants';
import { VTButton } from './index';

export interface SelectedLocationData {
  primaryAddress: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (data: SelectedLocationData) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
}

interface SuggestionItem {
  id: string;
  title: string;
  subtitle: string;
  lat?: number;
  lng?: number;
  fullAddress: string;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialAddress = '',
  initialLat = 37.78825,
  initialLng = -122.4324,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Map state
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
  const [mapAddress, setMapAddress] = useState('');
  const [loadingMapAddress, setLoadingMapAddress] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearchQuery(initialAddress);
      setSuggestions([]);
      setShowMapPicker(false);
      if (initialLat && initialLng) {
        setMapRegion({
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        });
      }
    }
  }, [visible, initialAddress, initialLat, initialLng]);

  // Debounced search
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
      // 1. If Google API Key is present, try Google Places Autocomplete
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

      // 2. Fallback: Free OpenStreetMap Nominatim Autocomplete
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

    let city = '';
    let state = '';
    let country = '';
    let street = '';

    try {
      if (lat && lng) {
        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (rev && rev[0]) {
          city = rev[0].city || '';
          state = rev[0].region || '';
          country = rev[0].country || '';
          street = [rev[0].streetNumber, rev[0].street].filter(Boolean).join(' ');
        }
      }
    } catch (e) {
      // Ignored
    }

    onSelectLocation({
      primaryAddress: item.fullAddress || `${item.title}, ${item.subtitle}`,
      streetAddress: street || item.title,
      city,
      state,
      country,
      latitude: lat,
      longitude: lng,
    });
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    setDetectingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to detect your location.');
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

        onSelectLocation({
          primaryAddress: fullAddr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          streetAddress: street,
          city: p.city || '',
          state: p.region || '',
          country: p.country || '',
          latitude: lat,
          longitude: lng,
        });
        onClose();
      } else {
        onSelectLocation({
          primaryAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          latitude: lat,
          longitude: lng,
        });
        onClose();
      }
    } catch (err: any) {
      alert(err?.message || 'Could not fetch current GPS location.');
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

    onSelectLocation({
      primaryAddress: mapAddress || `${mapRegion.latitude.toFixed(4)}, ${mapRegion.longitude.toFixed(4)}`,
      streetAddress: street,
      city,
      state,
      country,
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    });
    setShowMapPicker(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{showMapPicker ? 'Pin on Map' : 'Set Location'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {!showMapPicker ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Search Input Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search address, city, or place..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searching && <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />}
            </View>

            {/* Action Buttons */}
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

            {/* Suggestions List */}
            <View style={styles.suggestionsContainer}>
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
              ) : (
                <View style={styles.emptyPrompt}>
                  <Ionicons name="navigate-circle-outline" size={56} color="#CBD5E1" />
                  <Text style={styles.emptyPromptTitle}>Enter your address</Text>
                  <Text style={styles.emptyPromptSub}>
                    Type your street, building, or city to see live suggestions, or use GPS detection.
                  </Text>
                </View>
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
    </Modal>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    height: 52,
    marginTop: Spacing.lg,
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
  suggestionsContainer: {
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

export default LocationPickerModal;
