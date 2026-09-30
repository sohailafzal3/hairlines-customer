import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
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
import { ProfileApi } from '../../api';
import { kGoogleApiKey } from '../../constants';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'SetLocation'>;
};

interface AddressPrediction {
  place_id: string;
  description: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface SavedAddressItem {
  id?: string;
  type?: number;
  title?: string;
  primaryAddress: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

const SetLocationScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createJob, setCreateJobField } = useJobStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState(
    createJob.primaryAddress || (typeof user?.permanentAddress === 'string' ? user.permanentAddress : user?.permanentAddress?.primaryAddress) || ''
  );
  const [streetAddressLine1, setStreetAddressLine1] = useState(
    createJob.streetAddressLine1 || user?.streetAddressLine1 || ''
  );
  const [streetAddressLine2, setStreetAddressLine2] = useState(
    createJob.streetAddressLine2 || user?.streetAddressLine2 || ''
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);

  // Search Predictions State
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      setLoadingSavedAddresses(true);
      const res: any = await ProfileApi.getAddress();
      const list = res?.addresses || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setSavedAddresses(list);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingSavedAddresses(false);
    }
  };

  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim() || text.length < 2) {
      setPredictions([]);
      return;
    }

    setSearching(true);
    try {
      let found: AddressPrediction[] = [];

      // 1. Google Places Autocomplete API
      if (kGoogleApiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            text
          )}&key=${kGoogleApiKey}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === 'OK' && json.predictions?.length > 0) {
            found = json.predictions.map((p: any) => ({
              place_id: p.place_id,
              description: p.description,
            }));
          }
        } catch (err) {
          console.warn('Google places search error:', err);
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim
      if (found.length === 0) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&addressdetails=1&limit=6`;
          const res = await fetch(nomUrl, {
            headers: { 'User-Agent': 'HairlinesCustomerApp/1.0 (support@hairlines.app)' },
          });
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            found = json.map((item: any) => {
              const addr = item.address || {};
              const cty = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || '';
              const st = addr.state || '';
              const pc = addr.postcode || '';
              return {
                place_id: `osm_${item.place_id}`,
                description: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                city: cty,
                state: st,
                postalCode: pc,
                country: addr.country || '',
              };
            });
          }
        } catch (nomErr) {
          console.warn('Nominatim search error:', nomErr);
        }
      }

      setPredictions(found);
    } catch (e) {
      console.warn('Address search general error:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPrediction = async (prediction: AddressPrediction) => {
    setSearchQuery('');
    setPredictions([]);

    if (prediction.lat && prediction.lng) {
      setAddress(prediction.description);
      setLatitude(prediction.lat);
      setLongitude(prediction.lng);
      if (prediction.city) setCity(prediction.city);
      if (prediction.state) setState(prediction.state);
      if (prediction.country) setCountry(prediction.country);
      return;
    }

    if (prediction.place_id && kGoogleApiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address,address_components&key=${kGoogleApiKey}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === 'OK' && json.result) {
          const result = json.result;
          const lat = result.geometry?.location?.lat || 37.7749;
          const lng = result.geometry?.location?.lng || -122.4194;
          const formatted = result.formatted_address || prediction.description;

          let cty = '';
          let st = '';
          let ctry = '';
          if (result.address_components) {
            for (const comp of result.address_components) {
              if (comp.types.includes('locality')) cty = comp.long_name;
              if (comp.types.includes('administrative_area_level_1')) st = comp.short_name;
              if (comp.types.includes('country')) ctry = comp.long_name;
            }
          }

          setAddress(formatted);
          setLatitude(lat);
          setLongitude(lng);
          if (cty) setCity(cty);
          if (st) setState(st);
          if (ctry) setCountry(ctry);
          return;
        }
      } catch (err) {
        console.warn('Google place details error:', err);
      }
    }

    // Fallback: set description directly
    setAddress(prediction.description);
  };

  const handleSelectSavedAddress = (item: SavedAddressItem) => {
    setAddress(item.primaryAddress);
    if (item.streetAddressLine1) setStreetAddressLine1(item.streetAddressLine1);
    if (item.streetAddressLine2) setStreetAddressLine2(item.streetAddressLine2);
    if (item.city) setCity(item.city);
    if (item.state) setState(item.state);
    if (item.country) setCountry(item.country);
    if (item.latitude) setLatitude(item.latitude);
    if (item.longitude) setLongitude(item.longitude);

    Toast.show({
      type: 'info',
      text1: 'Address Selected',
      text2: item.primaryAddress,
    });
  };

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

    setCreateJobField('primaryAddress', address.trim());
    setCreateJobField('streetAddressLine1', streetAddressLine1.trim());
    setCreateJobField('streetAddressLine2', streetAddressLine2.trim());
    setCreateJobField('city', city.trim() || 'San Francisco');
    setCreateJobField('state', state.trim() || 'CA');
    setCreateJobField('country', country.trim() || 'USA');
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
      <Header title="Service Address" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 90 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Autocomplete Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search street, area or city..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCorrect={false}
            />
            {searching ? (
              <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setPredictions([]); }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Predictions Dropdown */}
          {predictions.length > 0 && (
            <View style={styles.predictionsCard}>
              {predictions.map((p, idx) => (
                <TouchableOpacity
                  key={p.place_id || `pred_${idx}`}
                  style={styles.predictionItem}
                  onPress={() => handleSelectPrediction(p)}
                >
                  <Ionicons name="location-outline" size={18} color={Colors.ButtonPrimaryColor} style={{ marginRight: 10 }} />
                  <Text style={styles.predictionText} numberOfLines={2}>
                    {p.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Location Action Buttons */}
        <View style={styles.quickActionsRow}>
          {/* Current Location Action Button */}
          <TouchableOpacity
            style={styles.actionCard}
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
              <Text style={styles.actionCardTitle}>Use Current Location</Text>
              <Text style={styles.actionCardSub}>
                {loadingLocation ? 'Detecting coordinates...' : 'Get address from GPS'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Pin On Map Action Button */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Map')}
            activeOpacity={0.8}
          >
            <View style={[styles.locationIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="map" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionCardTitle}>Set Location on Map</Text>
              <Text style={styles.actionCardSub}>Pick exact pin coordinates interactively</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Saved Addresses Section */}
        {savedAddresses.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionHeaderTitle}>Saved Addresses</Text>
            {savedAddresses.map((sa, i) => (
              <TouchableOpacity
                key={sa.id || `saved_${i}`}
                style={styles.savedAddressCard}
                onPress={() => handleSelectSavedAddress(sa)}
                activeOpacity={0.7}
              >
                <View style={styles.savedAddressIconCircle}>
                  <Ionicons
                    name={sa.type === 1 ? 'home' : sa.type === 2 ? 'briefcase' : 'location'}
                    size={18}
                    color={Colors.ButtonPrimaryColor}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.savedAddressTitle}>
                    {sa.type === 1 ? 'Home' : sa.type === 2 ? 'Work' : sa.title || 'Saved Location'}
                  </Text>
                  <Text style={styles.savedAddressSub} numberOfLines={2}>
                    {sa.primaryAddress}
                    {sa.streetAddressLine1 ? `, ${sa.streetAddressLine1}` : ''}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.ButtonPrimaryColor} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Address Details</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Address Input Form */}
        <View style={styles.formCard}>
          <Input
            label="Primary Address"
            placeholder="e.g. 742 Evergreen Terrace"
            value={address}
            onChangeText={setAddress}
            leftIcon="location-outline"
          />

          <Input
            label="Apt / Suite / Unit # (Street Address Line 1)"
            placeholder="e.g. Apt 4B, Suite 200, Unit 12"
            value={streetAddressLine1}
            onChangeText={setStreetAddressLine1}
            leftIcon="business-outline"
          />

          <Input
            label="Building / Entry Notes (Street Address Line 2 - Optional)"
            placeholder="e.g. Building B, Gate code #1234"
            value={streetAddressLine2}
            onChangeText={setStreetAddressLine2}
            leftIcon="information-circle-outline"
          />

          <View style={styles.twoColumnRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="City"
                placeholder="e.g. San Francisco"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="State"
                placeholder="e.g. CA"
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

          {/* Coordinates Display Badge */}
          <View style={styles.coordBadge}>
            <Ionicons name="navigate-circle" size={16} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.coordText}>
              Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>
          </View>
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
  searchSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    color: '#1E293B',
  },
  predictionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    overflow: 'hidden',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  predictionText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  quickActionsRow: {
    gap: 10,
    marginBottom: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${Colors.ButtonPrimaryColor}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  actionCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  savedSection: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  savedAddressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedAddressTitle: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: '#1E293B',
  },
  savedAddressSub: {
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
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  coordText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
