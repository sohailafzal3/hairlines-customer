import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Modal } from 'react-native';
import { VTButton, VTTextField, LocationPickerModal, SelectedLocationData } from '../../components/common';
import { ProfileApi, UploadApi } from '../../api';
import { useAuthStore } from '../../store';
import { MyProfile } from '../../models';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyProfile'>;
};

const DISABILITY_OPTIONS = [
  { id: 0, label: 'None' },
  { id: 1, label: 'Mental disability' },
  { id: 2, label: 'Physical disability' },
];

// Helper to reliably format Unix timestamp, ISO string, or date string into MM/DD/YYYY
export const formatDOB = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number' && val > 0) {
    const ms = val < 10000000000 ? val * 1000 : val;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    const num = Number(val);
    if (!isNaN(num) && num > 10000) {
      const ms = num < 10000000000 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      }
    }
    if (val.includes('-') || val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      }
    }
    return val;
  }
  return '';
};

const MyProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, account, setAccount, setUser, logout } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);

  // Extract initial values with comprehensive fallbacks
  const initialProfileImage =
    user?.profileImage || (user as any)?.profileImageUrl || (account as any)?.profileImageUrl || (account as any)?.profileImage || '';

  const initialFirstName = user?.firstName || (account as any)?.firstName || '';
  const initialLastName = user?.lastName || (account as any)?.lastName || '';
  const initialEmail = user?.email || (account as any)?.email || '';
  const initialPhone = user?.phoneNumber
    ? `${(user as any)?.phonePreFix || user?.countryCode || ''} ${user?.phoneNumber}`.trim()
    : (account as any)?.phoneNumber || '';

  const initialGender =
    (user as any)?.gender === 'Female' || (account as any)?.gender === 'Female' ? 'Female' : 'Male';

  const initialDOB = formatDOB((user as any)?.dateOfBirth || (account as any)?.dateOfBirth);

  const initialDisability =
    typeof (user as any)?.isPhysicallyDisabled === 'number'
      ? (user as any).isPhysicallyDisabled
      : typeof (account as any)?.isPhysicallyDisabled === 'number'
      ? (account as any).isPhysicallyDisabled
      : 0;

  const initialAddress =
    (user as any)?.residanceAddress?.primaryAddress ||
    (user as any)?.primaryAddress ||
    (user as any)?.address ||
    (account as any)?.residanceAddress ||
    '';

  const initialStreetAddress =
    (user as any)?.residanceAddress?.streetAddressLine1 ||
    (user as any)?.residanceStreetAddress ||
    (user as any)?.streetAddressLine1 ||
    (user as any)?.streetAddress ||
    (account as any)?.residanceStreetAddress ||
    (account as any)?.streetAddressLine1 ||
    '';

  const initialResidenceName =
    (user as any)?.residanceName || (account as any)?.residanceName || '';

  const initialInstituteName =
    (user as any)?.instituteName || (account as any)?.instituteName || '';

  // Component States
  const [profileImage, setProfileImage] = useState(initialProfileImage);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [gender, setGender] = useState<'Male' | 'Female'>(initialGender);
  const [dateOfBirth, setDateOfBirth] = useState(initialDOB);
  const [disability, setDisability] = useState<number>(initialDisability);
  const [address, setAddress] = useState(initialAddress);
  const [streetAddress, setStreetAddress] = useState(initialStreetAddress);
  const [residenceName, setResidenceName] = useState(initialResidenceName);
  const [instituteName, setInstituteName] = useState(initialInstituteName);
  const [latitude, setLatitude] = useState<number>((user as any)?.latitude || 0);
  const [longitude, setLongitude] = useState<number>((user as any)?.longitude || 0);
  const [avgRating, setAvgRating] = useState<number>((user as any)?.avgRating || (account as any)?.avgRating || 0);

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(() => {
    if (initialDOB) {
      const p = new Date(initialDOB);
      if (!isNaN(p.getTime())) return p;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  });

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      setPickerDate(date);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      setDateOfBirth(`${mm}/${dd}/${yyyy}`);
    }
  };


  // Sync state whenever auth store user/account updates
  useEffect(() => {
    if (user || account) {
      if (user?.firstName || (account as any)?.firstName) {
        setFirstName(user?.firstName || (account as any)?.firstName || '');
      }
      if (user?.lastName || (account as any)?.lastName) {
        setLastName(user?.lastName || (account as any)?.lastName || '');
      }
      if (user?.email || (account as any)?.email) {
        setEmail(user?.email || (account as any)?.email || '');
      }
      if (user?.phoneNumber || (account as any)?.phoneNumber) {
        setPhone(
          user?.phoneNumber
            ? `${(user as any)?.phonePreFix || user?.countryCode || ''} ${user?.phoneNumber}`.trim()
            : (account as any)?.phoneNumber || ''
        );
      }
      if (user?.profileImage || (account as any)?.profileImageUrl) {
        setProfileImage(user?.profileImage || (account as any)?.profileImageUrl || '');
      }
      const addr =
        (user as any)?.residanceAddress?.primaryAddress ||
        (user as any)?.primaryAddress ||
        (user as any)?.address ||
        (account as any)?.residanceAddress;
      if (addr) setAddress(addr);

      const str =
        (user as any)?.residanceAddress?.streetAddressLine1 ||
        (user as any)?.residanceStreetAddress ||
        (user as any)?.streetAddressLine1 ||
        (account as any)?.residanceStreetAddress;
      if (str) setStreetAddress(str);

      const dob = formatDOB((user as any)?.dateOfBirth || (account as any)?.dateOfBirth);
      if (dob) setDateOfBirth(dob);

      const resName = (user as any)?.residanceName || (account as any)?.residanceName;
      if (resName) setResidenceName(resName);

      const instName = (user as any)?.instituteName || (account as any)?.instituteName;
      if (instName) setInstituteName(instName);
    }
  }, [user, account]);

  // Load from backend on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const res: any = await ProfileApi.fetchProfile();
      if (res) {
        const data: any = res.data || res;

        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
        if (data.email) setEmail(data.email);
        if (data.phoneNumber) {
          setPhone(`${data.phonePreFix || ''} ${data.phoneNumber}`.trim());
        }
        if (data.profileImage || data.profileImageUrl) {
          setProfileImage(data.profileImage || data.profileImageUrl);
        }
        if (data.gender) setGender(data.gender === 'Female' ? 'Female' : 'Male');

        // Parse Date of Birth
        if (data.dateOfBirth) {
          setDateOfBirth(formatDOB(data.dateOfBirth));
        }

        if (typeof data.isPhysicallyDisabled === 'number') {
          setDisability(data.isPhysicallyDisabled);
        }

        // Parse Address & Street
        if (data.residanceAddress) {
          if (typeof data.residanceAddress === 'object') {
            if (data.residanceAddress.primaryAddress) {
              setAddress(data.residanceAddress.primaryAddress);
            }
            if (data.residanceAddress.streetAddressLine1) {
              setStreetAddress(data.residanceAddress.streetAddressLine1);
            }
            if (data.residanceAddress.latitude) {
              setLatitude(data.residanceAddress.latitude);
            }
            if (data.residanceAddress.longitude) {
              setLongitude(data.residanceAddress.longitude);
            }
          } else if (typeof data.residanceAddress === 'string') {
            setAddress(data.residanceAddress);
          }
        } else if (data.primaryAddress) {
          setAddress(data.primaryAddress);
        } else if (data.address) {
          setAddress(data.address);
        }

        if (data.residanceStreetAddress) {
          setStreetAddress(data.residanceStreetAddress);
        } else if (data.streetAddressLine1) {
          setStreetAddress(data.streetAddressLine1);
        }

        if (data.residanceName || data.residenceName) {
          setResidenceName(data.residanceName || data.residenceName);
        }
        if (data.instituteName) setInstituteName(data.instituteName);
        if (data.avgRating) setAvgRating(data.avgRating);
      }
    } catch (err) {
      console.log('Profile fetch notice:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, []);

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please allow access to your photo library.',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;
        setProfileImage(localUri);

        setUploadingImage(true);
        try {
          const formData = new FormData();
          const filename = localUri.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('image', {
            uri: localUri,
            name: filename,
            type,
          } as any);

          const uploadRes: any = await UploadApi.uploadProfileImage(formData);
          if (uploadRes?.imageUrl || uploadRes?.url || uploadRes?.data?.url) {
            const remoteUrl = uploadRes.imageUrl || uploadRes.url || uploadRes.data?.url;
            setProfileImage(remoteUrl);
            // Also update local store
            const current = useAuthStore.getState().user;
            if (current) {
              setUser({ ...current, profileImage: remoteUrl } as any);
            }
          }
        } catch (uploadErr) {
          console.log('Upload image note:', uploadErr);
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err: any) {
      console.error('Pick image error:', err);
    }
  };

  const handleLocationSelected = (loc: SelectedLocationData) => {
    setAddress(loc.primaryAddress);
    if (loc.streetAddress) {
      setStreetAddress(loc.streetAddress);
    }
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter your first name.' });
      return;
    }
    if (!lastName.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter your last name.' });
      return;
    }

    setSaving(true);
    try {
      let dobTimestamp = 0;
      if (dateOfBirth.trim()) {
        const parsed = new Date(dateOfBirth).getTime();
        if (!isNaN(parsed)) {
          dobTimestamp = Math.floor(parsed / 1000);
        }
      }

      await ProfileApi.editProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileImageUrl: profileImage || '',
        email: email.trim().toLowerCase(),
        isPhysicallyDisabled: disability,
        gender,
        dateOfBirth: dobTimestamp > 0 ? dobTimestamp : dateOfBirth.trim(),
        residanceName: residenceName.trim(),
        instituteName: instituteName.trim(),
        residanceAddress: address.trim(),
        residanceStreetAddress: streetAddress.trim(),
        residanceLatitude: latitude,
        residanceLongitude: longitude,
      });

      // Update local auth store so all screens have the latest profile immediately
      const current = useAuthStore.getState().user;
      setUser({
        ...(current as any),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim().toLowerCase(),
        profileImage: profileImage || '',
        gender,
        dateOfBirth: dateOfBirth.trim(),
        isPhysicallyDisabled: disability,
        address: address.trim(),
        primaryAddress: address.trim(),
        streetAddressLine1: streetAddress.trim(),
        residanceStreetAddress: streetAddress.trim(),
        residanceAddress: {
          primaryAddress: address.trim(),
          streetAddressLine1: streetAddress.trim(),
          latitude,
          longitude,
        },
        residanceName: residenceName.trim(),
        instituteName: instituteName.trim(),
      } as any);

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your account details have been saved.',
      });
      setIsEditing(false);
      await loadProfileData();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Could not update profile details.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your Hairlines account? This action cannot be undone and will erase your account data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProfileApi.deleteAccount();
              await logout();
            } catch (error) {
              console.error('Delete account error:', error);
            }
          },
        },
      ]
    );
  };

  const displayName = `${firstName} ${lastName}`.trim() || user?.name || 'My Profile';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).openDrawer?.()}
          style={styles.menuButton}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          activeOpacity={0.7}
          style={styles.editTouch}
        >
          <Text style={styles.editText}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.ButtonPrimaryColor]} />}
        >
          {/* Avatar Hero Card */}
          <View style={styles.avatarCard}>
            <TouchableOpacity
              onPress={handleImagePick}
              activeOpacity={0.9}
              style={styles.avatarWrapper}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>
                    {firstName?.charAt(0)?.toUpperCase() || 'U'}
                    {lastName?.charAt(0)?.toUpperCase() || ''}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.nameText}>{displayName}</Text>

            {avgRating > 0 ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#EAB308" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{avgRating.toFixed(1)} Rating</Text>
              </View>
            ) : (
              <View style={styles.memberBadge}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
                <Text style={styles.memberText}>Verified Customer</Text>
              </View>
            )}
          </View>

          {/* Card 1: Personal Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>

            <View style={styles.rowFields}>
              <VTTextField
                label="First Name *"
                value={firstName}
                onChangeText={setFirstName}
                editable={isEditing}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
              <VTTextField
                label="Last Name *"
                value={lastName}
                onChangeText={setLastName}
                editable={isEditing}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
            </View>

            <VTTextField
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="#64748B" />}
            />

            <VTTextField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              editable={false}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color="#64748B" />}
            />

            {/* Gender Toggle */}
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderSegmentRow}>
              {[
                { key: 'Male', label: 'Male', icon: 'male' },
                { key: 'Female', label: 'Female', icon: 'female' },
              ].map((item) => {
                const isActive = gender === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.genderCard,
                      isActive && styles.genderCardActive,
                      !isEditing && { opacity: 0.8 },
                    ]}
                    onPress={() => isEditing && setGender(item.key as any)}
                    disabled={!isEditing}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isActive ? Colors.ButtonPrimaryColor : '#64748B'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.genderCardText, isActive && styles.genderCardTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => isEditing && setShowDatePicker(true)}
              activeOpacity={isEditing ? 0.8 : 1}
            >
              <VTTextField
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={false}
                placeholder="MM/DD/YYYY"
                leftIcon={<Ionicons name="calendar-outline" size={18} color="#64748B" />}
                rightIcon={isEditing ? <Ionicons name="calendar" size={18} color={Colors.ButtonPrimaryColor} /> : undefined}
                onRightIconPress={() => isEditing && setShowDatePicker(true)}
              />
            </TouchableOpacity>

            {/* Category Assistance */}
            <Text style={styles.inputLabel}>Category / Assistance</Text>
            <View style={styles.disabilityRow}>
              {DISABILITY_OPTIONS.map((item) => {
                const isSelected = disability === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.disabilityPill,
                      isSelected && styles.disabilityPillActive,
                      !isEditing && { opacity: 0.8 },
                    ]}
                    onPress={() => isEditing && setDisability(item.id)}
                    disabled={!isEditing}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.disabilityText, isSelected && styles.disabilityTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Card 2: Address Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>ADDRESS & LOCATION</Text>
              {isEditing && (
                <TouchableOpacity
                  onPress={() => setShowLocationModal(true)}
                  style={styles.gpsButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate-circle-outline" size={16} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
                  <Text style={styles.gpsButtonText}>Pick Location</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => isEditing && setShowLocationModal(true)}
              activeOpacity={isEditing ? 0.85 : 1}
            >
              <VTTextField
                label="Primary Address"
                value={address}
                onChangeText={setAddress}
                editable={isEditing}
                placeholder="Tap to search or pick address..."
                leftIcon={<Ionicons name="location-outline" size={18} color="#64748B" />}
                rightIcon={isEditing ? <Ionicons name="search" size={18} color={Colors.ButtonPrimaryColor} /> : undefined}
                onRightIconPress={() => isEditing && setShowLocationModal(true)}
              />
            </TouchableOpacity>

            <VTTextField
              label="Street Address / Apt / Suite"
              value={streetAddress}
              onChangeText={setStreetAddress}
              editable={isEditing}
              placeholder="Apt 4B, 123 Main Street"
              leftIcon={<Ionicons name="home-outline" size={18} color="#64748B" />}
            />

            <View style={styles.rowFields}>
              <VTTextField
                label="Residence Name"
                value={residenceName}
                onChangeText={setResidenceName}
                editable={isEditing}
                placeholder="Building Name"
                style={styles.flexHalf}
              />
              <VTTextField
                label="Workplace / Institute"
                value={instituteName}
                onChangeText={setInstituteName}
                editable={isEditing}
                placeholder="Company Name"
                style={styles.flexHalf}
              />
            </View>
          </View>

          {/* Save Button (when editing) */}
          {isEditing && (
            <VTButton
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
            />
          )}

          {/* Card 3: Account Management & Security */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>ACCOUNT SECURITY</Text>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={styles.deleteButton}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date of Birth Picker Modal */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible={showDatePicker}>
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerCard}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ padding: 6 }}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Date of Birth</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const mm = String(pickerDate.getMonth() + 1).padStart(2, '0');
                      const dd = String(pickerDate.getDate()).padStart(2, '0');
                      const yyyy = pickerDate.getFullYear();
                      setDateOfBirth(`${mm}/${dd}/${yyyy}`);
                      setShowDatePicker(false);
                    }}
                    style={{ padding: 6 }}
                  >
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                  textColor="#0F172A"
                  style={{ height: 180 }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleLocationSelected}
        initialAddress={address}
        initialLat={latitude || 37.78825}
        initialLng={longitude || -122.4324}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  datePickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: Spacing.sm,
  },
  datePickerTitle: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  datePickerCancel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  datePickerDone: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  editTouch: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: '#EEF4FF',
  },
  editText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.ButtonPrimaryColor,
  },
  imagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.ButtonPrimaryColor,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  nameText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#854D0E',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  memberText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  gpsButtonText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: '#334155',
    marginBottom: Spacing.xs,
  },
  genderSegmentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  genderCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  genderCardText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  genderCardTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontFamily: Fonts.uberMoveBold,
  },
  disabilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.base,
  },
  disabilityPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  disabilityPillActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  disabilityText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  disabilityTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontFamily: Fonts.uberMoveBold,
  },
  saveButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginBottom: Spacing.lg,
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
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: Spacing.xl,
  },
  dangerTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#EF4444',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#EF4444',
  },
});

export default MyProfileScreen;
