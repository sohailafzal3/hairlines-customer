import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { ProfileApi, AuthApi, UploadApi } from '../../api';
import { useAuthStore } from '../../store';
import { MyProfile } from '../../models';
import { kGoogleApiKey } from '../../constants';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyProfile'>;
};

interface AddressPrediction {
  place_id: string;
  description: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  postalCode?: string;
}

const MyProfileScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Address Selection Modal State
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressPredictions, setAddressPredictions] = useState<AddressPrediction[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Change Password Modal
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res: any = await ProfileApi.fetchProfile();
      const p: MyProfile = res?.profile || res?.data || res;
      if (p) {
        setProfileImage(p.profileImage || '');
        setFirstName(p.firstName || '');
        setLastName(p.lastName || '');
        setEmail(p.email || '');
        setPhone(`${p.phonePreFix || '+1'} ${p.phoneNumber || ''}`);
        const addrStr = typeof p.residanceAddress === 'string' ? p.residanceAddress : p.residanceAddress?.primaryAddress || '';
        setAddress(addrStr);
        setGender(p.gender || 'Male');
      }
    } catch (e: any) {
      console.log('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  // Google Places + OSM Nominatim + Native Autocomplete Search
  const searchAddress = async (text: string) => {
    setAddressQuery(text);
    if (!text.trim() || text.length < 2) {
      setAddressPredictions([]);
      return;
    }
    setSearchingAddress(true);
    try {
      let foundPredictions: AddressPrediction[] = [];

      // 1. Google Places Autocomplete
      if (kGoogleApiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            text
          )}&key=${kGoogleApiKey}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === 'OK' && json.predictions?.length > 0) {
            foundPredictions = json.predictions.map((p: any) => ({
              place_id: p.place_id,
              description: p.description,
            }));
          }
        } catch (err) {
          console.warn('Google places search error:', err);
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim
      if (foundPredictions.length === 0) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&addressdetails=1&limit=6`;
          const res = await fetch(nomUrl, {
            headers: { 'User-Agent': 'HairlinesCustomerApp/1.0 (support@hairlines.app)' },
          });
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            foundPredictions = json.map((item: any) => {
              const addr = item.address || {};
              const cty = addr.city || addr.town || addr.village || addr.suburb || '';
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
              };
            });
          }
        } catch (err) {
          console.warn('OSM search error:', err);
        }
      }

      // 3. Fallback to Native Expo Geocoding
      if (foundPredictions.length === 0) {
        try {
          const geoResults = await Location.geocodeAsync(text);
          if (geoResults && geoResults.length > 0) {
            const topGeo = geoResults[0];
            const rev = await Location.reverseGeocodeAsync({
              latitude: topGeo.latitude,
              longitude: topGeo.longitude,
            });
            const first = rev?.[0];
            const desc = first
              ? [
                  first.streetNumber,
                  first.street || first.name,
                  first.city || first.subregion,
                  first.region,
                  first.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ')
              : text;

            foundPredictions = [
              {
                place_id: `geo_${topGeo.latitude}_${topGeo.longitude}`,
                description: desc || text,
                lat: topGeo.latitude,
                lng: topGeo.longitude,
                city: first?.city || first?.subregion || '',
                state: first?.region || '',
                postalCode: first?.postalCode || '',
              },
            ];
          }
        } catch (err) {
          console.warn('Native geocode search error:', err);
        }
      }

      setAddressPredictions(foundPredictions);
    } catch (e) {
      console.warn('Places search error:', e);
      setAddressPredictions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Select Place Prediction
  const selectPlacePrediction = async (prediction: AddressPrediction) => {
    setSearchingAddress(true);
    try {
      if (prediction.lat !== undefined && prediction.lng !== undefined) {
        setAddress(prediction.description);
        setLatitude(prediction.lat);
        setLongitude(prediction.lng);
        setAddressModalVisible(false);
        setAddressQuery('');
        setAddressPredictions([]);
        return;
      }

      let lat = 0;
      let lng = 0;
      let fullAddr = prediction.description;

      if (kGoogleApiKey && prediction.place_id && !prediction.place_id.startsWith('osm_')) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=formatted_address,geometry&key=${kGoogleApiKey}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === 'OK' && json.result) {
            fullAddr = json.result.formatted_address || prediction.description;
            lat = json.result.geometry?.location?.lat || 0;
            lng = json.result.geometry?.location?.lng || 0;
          }
        } catch (err) {
          console.warn('Google place details error:', err);
        }
      }

      if (!lat || !lng) {
        try {
          const geo = await Location.geocodeAsync(prediction.description);
          if (geo && geo.length > 0) {
            lat = geo[0].latitude;
            lng = geo[0].longitude;
          }
        } catch (err) {
          console.warn('Native geocode fallback error:', err);
        }
      }

      setAddress(fullAddr);
      if (lat) setLatitude(lat);
      if (lng) setLongitude(lng);

      setAddressModalVisible(false);
      setAddressQuery('');
      setAddressPredictions([]);
    } catch (e: any) {
      Alert.alert('Error', 'Could not fetch place details. Please try again.');
    } finally {
      setSearchingAddress(false);
    }
  };

  // Use Current Location
  const handleUseCurrentLocation = async () => {
    try {
      setSearchingAddress(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to detect your location.'
        );
        return;
      }

      let lat = 0;
      let lng = 0;

      const lastLoc = await Location.getLastKnownPositionAsync();
      if (lastLoc) {
        lat = lastLoc.coords.latitude;
        lng = lastLoc.coords.longitude;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch (locErr) {
        console.warn('Current position err, using last known:', locErr);
      }

      if (!lat && !lng) {
        lat = 37.7749;
        lng = -122.4194;
      }

      let resolved = false;

      // 1. Native Expo Reverse Geocoding
      try {
        const rev = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (rev && rev.length > 0) {
          const item = rev[0];
          const parts = [
            item.name || item.streetNumber,
            item.street,
            item.city || item.subregion || item.district,
            item.region,
            item.postalCode,
            item.country,
          ].filter(Boolean);

          const fullAddr = parts.join(', ');
          if (fullAddr) {
            setAddress(fullAddr);
            setLatitude(lat);
            setLongitude(lng);
            setAddressModalVisible(false);
            resolved = true;
          }
        }
      } catch (err) {
        console.warn('Native reverse geocode error:', err);
      }

      if (resolved) return;

      // 2. Google Geocoding API
      if (kGoogleApiKey) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${kGoogleApiKey}`;
          const res = await fetch(geocodeUrl);
          const json = await res.json();
          if (json.status === 'OK' && json.results?.length > 0) {
            setAddress(json.results[0].formatted_address);
            setLatitude(lat);
            setLongitude(lng);
            setAddressModalVisible(false);
            resolved = true;
          }
        } catch (err) {
          console.warn('Google reverse geocode error:', err);
        }
      }

      if (resolved) return;

      // 3. OpenStreetMap Nominatim Reverse Geocoding
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(nomUrl, {
          headers: { 'User-Agent': 'HairlinesCustomerApp/1.0 (support@hairlines.app)' },
        });
        const json = await res.json();
        if (json && json.display_name) {
          setAddress(json.display_name);
          setLatitude(lat);
          setLongitude(lng);
          setAddressModalVisible(false);
          resolved = true;
        }
      } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
      }

      if (!resolved) {
        setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setLatitude(lat);
        setLongitude(lng);
        setAddressModalVisible(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to get current location');
    } finally {
      setSearchingAddress(false);
    }
  };

  // Quick Preset Address (Home / Work)
  const handleQuickPreset = (presetType: 'Home' | 'Work') => {
    const defaultAddr =
      presetType === 'Home'
        ? '742 Evergreen Terrace, Springfield'
        : '100 Business Park Blvd, Suite 200';
    setAddress(defaultAddr);
    setAddressModalVisible(false);
    Toast.show({
      type: 'info',
      text1: `${presetType} Address Selected`,
      text2: 'You can customize it anytime before saving.',
    });
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow camera roll access to update your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);

      try {
        setUploadingPhoto(true);
        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'profile.jpg';
        formData.append('image', {
          uri: asset.uri,
          name: filename,
          type: 'image/jpeg',
        } as any);

        const uploadRes: any = await UploadApi.uploadProfileImage(formData);
        const uploadedUrl = uploadRes?.imageUrl || uploadRes?.data?.imageUrl || asset.uri;
        setProfileImage(uploadedUrl);
      } catch (err) {
        console.warn('Photo upload failed:', err);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'First name cannot be empty');
      return;
    }

    try {
      setUpdating(true);
      await ProfileApi.editProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileImageUrl: profileImage,
        email: email.trim(),
        gender,
        // iOS updateUserProfile requires these additional fields (ApiClient.swift:287-299)
        isPhysicallyDisabled: 0,
        dateOfBirth: 0,
        residanceName: '',
        instituteName: '',
        residanceAddress: address,
        residanceStreetAddress: '',
        residanceLatitude: latitude || 0,
        residanceLongitude: longitude || 0,
      });
      setIsEditing(false);
      Toast.show({ type: 'success', text1: 'Profile Updated!' });
      await loadProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await ProfileApi.changePassword(currentPassword, newPassword);
      setIsPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Toast.show({ type: 'success', text1: 'Password Updated Successfully' });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your Hairlines account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProfileApi.deleteAccount();
              await logout();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthApi.logout();
          } catch (e) {}
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity
          onPress={() => {
            if ((navigation as any).openDrawer) {
              (navigation as any).openDrawer();
            } else if ((navigation.getParent() as any)?.openDrawer) {
              (navigation.getParent() as any).openDrawer();
            } else {
              navigation.dispatch(DrawerActions.openDrawer());
            }
          }}
          style={styles.headerBtn}
        >
          <Ionicons name="menu" size={26} color={Colors.TitleColor} />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          <Text style={styles.editHeaderText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 30 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar Card */}
        <View style={styles.avatarCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={isEditing ? handleImagePick : undefined}
            disabled={!isEditing}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={44} color="#FFFFFF" />
              </View>
            )}
            {isEditing && (
              <View style={styles.cameraBadge}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                )}
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.profileName}>{firstName} {lastName}</Text>
          <Text style={styles.profileEmail}>{email || phone}</Text>
        </View>

        {/* Profile Form Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Personal Information</Text>

          <VTTextField
            label="First Name"
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditing}
          />

          <View style={{ height: 12 }} />

          <VTTextField
            label="Last Name"
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
            editable={isEditing}
          />

          <View style={{ height: 12 }} />

          <VTTextField
            label="Email Address"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
            keyboardType="email-address"
          />

          <View style={{ height: 12 }} />

          <VTTextField
            label="Phone Number"
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            editable={false}
          />

          <View style={{ height: 12 }} />

          {/* Primary Address Picker Field */}
          <Text style={styles.fieldLabel}>Primary Address</Text>
          <TouchableOpacity
            style={[styles.addressTrigger, !isEditing && styles.addressTriggerDisabled]}
            onPress={() => isEditing && setAddressModalVisible(true)}
            activeOpacity={isEditing ? 0.8 : 1}
            disabled={!isEditing}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={Colors.ButtonPrimaryColor}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.addressTriggerText,
                !address && { color: '#94A3B8' },
              ]}
              numberOfLines={2}
            >
              {address || 'Tap to search address, Home, or Current Location'}
            </Text>
            {isEditing && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#94A3B8"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Security & Account Options */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Account & Security</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setIsPasswordModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="key-outline" size={20} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.menuRowText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="log-out-outline" size={20} color="#F59E0B" />
              <Text style={[styles.menuRowText, { color: '#B45309' }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={handleDeleteAccount}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuRowText, { color: '#DC2626' }]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={{ marginTop: 10 }}>
            <VTButton title="Save Changes" onPress={handleSave} loading={updating} />
          </View>
        )}
      </ScrollView>

      <VTLoading visible={loading} />

      {/* Modal: Choose Address */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={[styles.addressModalContainer, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.addressModalHeader}>
            <TouchableOpacity
              onPress={() => setAddressModalVisible(false)}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.TitleColor} />
            </TouchableOpacity>
            <Text style={styles.addressModalTitle}>Choose Address</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Input */}
          <View style={styles.searchBarWrap}>
            <Ionicons
              name="search"
              size={20}
              color="#64748B"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search street, city, zip code..."
              placeholderTextColor="#94A3B8"
              value={addressQuery}
              onChangeText={searchAddress}
              style={styles.addressSearchInput}
              autoFocus={true}
              clearButtonMode="while-editing"
            />
            {searchingAddress && (
              <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
            )}
          </View>

          {/* Predictions Dropdown / Search Results (Top of list) */}
          {addressPredictions.length > 0 && (
            <View style={styles.predictionsSection}>
              <Text style={styles.quickOptionsTitle}>Search Results</Text>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
                {addressPredictions.map((item) => (
                  <TouchableOpacity
                    key={item.place_id}
                    style={styles.predictionItem}
                    onPress={() => selectPlacePrediction(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={Colors.ButtonPrimaryColor}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <Text style={styles.predictionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Preset Options */}
          <View style={styles.quickOptionsSection}>
            <Text style={styles.quickOptionsTitle}>Quick Suggestions</Text>
            <TouchableOpacity
              style={styles.quickOptionRow}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.8}
            >
              <View style={[styles.quickOptionIconWrap, { backgroundColor: '#EEF4FF' }]}>
                <Ionicons name="locate" size={20} color={Colors.ButtonPrimaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickOptionLabel}>Use Current Location</Text>
                <Text style={styles.quickOptionSub}>Auto-detect via GPS</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOptionRow}
              onPress={() => handleQuickPreset('Home')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickOptionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="home-outline" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickOptionLabel}>Home</Text>
                <Text style={styles.quickOptionSub}>Set as residential address</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOptionRow}
              onPress={() => handleQuickPreset('Work')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickOptionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="briefcase-outline" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickOptionLabel}>Work</Text>
                <Text style={styles.quickOptionSub}>Set as office or business location</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Change Password */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <VTTextField
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <View style={{ height: 12 }} />
              <VTTextField
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <View style={{ height: 12 }} />
              <VTTextField
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <View style={{ marginTop: 20 }}>
                <VTButton
                  title="Update Password"
                  onPress={handleChangePassword}
                  loading={changingPassword}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  addressTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  addressTriggerDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  addressTriggerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.TitleColor,
    fontWeight: '500',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TitleColor,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  addressModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  addressModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
  },
  addressModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  addressSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.TitleColor,
    fontWeight: '500',
  },
  predictionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.TitleColor,
    lineHeight: 20,
    fontWeight: '500',
  },
  quickOptionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickOptionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickOptionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.TitleColor,
  },
  quickOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default MyProfileScreen;
