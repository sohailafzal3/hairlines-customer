import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Modal } from 'react-native';
import { VTButton, VTTextField, LocationPickerModal, SelectedLocationData } from '../../components/common';
import { AuthApi, UploadApi } from '../../api';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS, kTermsLink, kPrivicyPolicyLink } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUpFirst'>;
};

const DISABILITY_OPTIONS = [
  { id: 0, label: 'None' },
  { id: 1, label: 'Mental disability' },
  { id: 2, label: 'Physical disability' },
];

const SignUpFirstScreen: React.FC<Props> = ({ navigation }) => {
  const { account, setAccount, setLoggedIn } = useAuthStore();

  // Personal Info
  const [profileImage, setProfileImage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [disability, setDisability] = useState<number>(0);
  const [referralCode, setReferralCode] = useState('');

  // Address Info
  const [address, setAddress] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [residenceName, setResidenceName] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(() => {
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


  // Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Terms & Conditions Checkbox
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status & Errors
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pick Image
  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Camera roll permissions are required to upload a profile photo.');
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

        // Upload to server
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
            setProfileImage(uploadRes.imageUrl || uploadRes.url || uploadRes.data?.url);
          }
        } catch (uploadErr) {
          console.log('Image upload warning:', uploadErr);
          // Keep local URI as fallback
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err: any) {
      console.error('Image pick error:', err);
    }
  };

  // Get Current Location
  const handleGetCurrentLocation = async () => {
    setFetchingLocation(true);
    setErrorMsg('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission is required to detect your address.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geo) {
        const formatted = [geo.streetNumber, geo.street, geo.city, geo.region, geo.postalCode]
          .filter(Boolean)
          .join(', ');
        setAddress(formatted || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        if (geo.street) {
          setStreetAddress(geo.street);
        }
      }
    } catch (locErr: any) {
      console.error('Location error:', locErr);
      setErrorMsg('Could not fetch current location. Please enter address manually.');
    } finally {
      setFetchingLocation(false);
    }
  };

  // Open external links for terms & privacy
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open link:', err));
  };

  const handleLocationSelected = (loc: SelectedLocationData) => {
    setAddress(loc.primaryAddress);
    if (loc.streetAddress) {
      setStreetAddress(loc.streetAddress);
    }
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  // Validation
  const validateForm = () => {
    if (!firstName.trim()) {
      setErrorMsg('Please enter your first name.');
      return false;
    }
    if (!lastName.trim()) {
      setErrorMsg('Please enter your last name.');
      return false;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }

    if (password.trim().length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password and confirm password do not match.');
      return false;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter your address or use current location.');
      return false;
    }

    if (!termsAccepted) {
      setErrorMsg('Please accept the Terms & Conditions to complete your registration.');
      return false;
    }

    return true;
  };

  // Submit
  const handleSubmit = async () => {
    setErrorMsg('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';

      // Format Date of Birth (Unix timestamp or string)
      let dobTimestamp = 0;
      if (dateOfBirth.trim()) {
        const parsed = new Date(dateOfBirth).getTime();
        if (!isNaN(parsed)) {
          dobTimestamp = Math.floor(parsed / 1000);
        }
      }

      const params = {
        countryCode: (account as any)?.countryCode || (account as any)?.phonePrefix || '+1',
        phoneNumber: account?.phoneNumber || '',
        userType: 1,
        deviceToken,
        deviceType: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileImageUrl: profileImage || '',
        referralCode: referralCode.trim(),
        isPhysicallyDisabled: disability,
        gender,
        dateOfBirth: dobTimestamp > 0 ? dobTimestamp : dateOfBirth.trim(),
        password,
        residanceName: residenceName.trim(),
        instituteName: instituteName.trim(),
        residanceAddress: address.trim(),
        residanceStreetAddress: streetAddress.trim(),
        residanceLatitude: latitude,
        residanceLongitude: longitude,
      };

      const updatedAccount = await AuthApi.basicInfo(params);
      const sessionData: any = updatedAccount || params;
      setAccount(sessionData);
      const { setUser } = useAuthStore.getState();
      setUser({
        ...sessionData,
        address: address.trim(),
        primaryAddress: address.trim(),
        streetAddressLine1: streetAddress.trim(),
        residanceStreetAddress: streetAddress.trim(),
        residanceAddress: {
          primaryAddress: address.trim(),
          streetAddressLine1: streetAddress.trim(),
        },
        residanceName: residenceName.trim(),
        instituteName: instituteName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender,
        isPhysicallyDisabled: disability,
      } as any);
      setLoggedIn(true);
      await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');

      navigation.navigate('ThankYou');
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrorMsg(error.message || 'Failed to complete registration. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
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
          {/* Top Bar - Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
            </TouchableOpacity>
          </View>

          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Complete your profile to start booking stylists</Text>
          </View>

          {/* Error Banner */}
          {!!errorMsg && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.errorViewColor} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* Avatar Upload Container */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleImagePick} activeOpacity={0.85} style={styles.avatarWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color="#94A3B8" />
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
            <Text style={styles.avatarLabel}>Upload Profile Photo</Text>
          </View>

          {/* Card 1: Personal Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>

            <View style={styles.rowFields}>
              <VTTextField
                label="First Name *"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
              <VTTextField
                label="Last Name *"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
            </View>

            <VTTextField
              label="Email Address *"
              placeholder="john.doe@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="#64748B" />}
            />

            {/* Gender Selection Segment */}
            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.genderSegmentRow}>
              {[
                { key: 'Male', label: 'Male', icon: 'male' },
                { key: 'Female', label: 'Female', icon: 'female' },
              ].map((item) => {
                const isActive = gender === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.genderCard, isActive && styles.genderCardActive]}
                    onPress={() => setGender(item.key as any)}
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
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <VTTextField
                label="Date of Birth *"
                placeholder="Tap to select date of birth (MM/DD/YYYY)"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={false}
                leftIcon={<Ionicons name="calendar-outline" size={18} color="#64748B" />}
                rightIcon={<Ionicons name="calendar" size={18} color={Colors.ButtonPrimaryColor} />}
                onRightIconPress={() => setShowDatePicker(true)}
              />
            </TouchableOpacity>

            {/* Special Care / Category */}
            <Text style={styles.inputLabel}>Category / Assistance</Text>
            <View style={styles.disabilityRow}>
              {DISABILITY_OPTIONS.map((item) => {
                const isSelected = disability === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.disabilityPill, isSelected && styles.disabilityPillActive]}
                    onPress={() => setDisability(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.disabilityText, isSelected && styles.disabilityTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <VTTextField
              label="Referral Code (Optional)"
              placeholder="Enter referral code"
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              leftIcon={<Ionicons name="gift-outline" size={18} color="#64748B" />}
            />
          </View>

          {/* Card 2: Address Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>ADDRESS & LOCATION</Text>
              <TouchableOpacity
                onPress={handleGetCurrentLocation}
                style={styles.gpsButton}
                activeOpacity={0.7}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
                ) : (
                  <>
                    <Ionicons name="navigate-circle-outline" size={16} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
                    <Text style={styles.gpsButtonText}>Use GPS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.85}
            >
              <VTTextField
                label="Primary Address *"
                placeholder="Tap to search or select address..."
                value={address}
                onChangeText={setAddress}
                leftIcon={<Ionicons name="location-outline" size={18} color="#64748B" />}
                rightIcon={<Ionicons name="search" size={18} color={Colors.ButtonPrimaryColor} />}
                onRightIconPress={() => setShowLocationModal(true)}
              />
            </TouchableOpacity>

            <VTTextField
              label="Street Address / Apt / Suite"
              placeholder="Apt 4B"
              value={streetAddress}
              onChangeText={setStreetAddress}
            />

            <View style={styles.rowFields}>
              <VTTextField
                label="Residence Name"
                placeholder="Building Name"
                value={residenceName}
                onChangeText={setResidenceName}
                style={styles.flexHalf}
              />
              <VTTextField
                label="Workplace / Institute"
                placeholder="Company Name"
                value={instituteName}
                onChangeText={setInstituteName}
                style={styles.flexHalf}
              />
            </View>
          </View>

          {/* Card 3: Security Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>SECURITY</Text>

            <VTTextField
              label="Password (min. 8 characters) *"
              placeholder="Enter secure password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#64748B" />}
            />

            <VTTextField
              label="Confirm Password *"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color="#64748B" />}
            />
          </View>

          {/* Card 4: Terms & Conditions Checkbox */}
          <View style={styles.termsCard}>
            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={styles.checkboxTouch}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                {termsAccepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsNormalText}>
                  I have read and agree with the{' '}
                  <Text onPress={() => handleOpenLink(kTermsLink)} style={styles.termsLink}>
                    Terms & Conditions
                  </Text>{' '}
                  and{' '}
                  <Text onPress={() => handleOpenLink(kPrivicyPolicyLink)} style={styles.termsLink}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Complete Registration Button */}
          <VTButton
            title="Create Account"
            onPress={handleSubmit}
            loading={loading}
            disabled={!firstName || !lastName || !email || !password || !confirmPassword || !address || !termsAccepted}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  topBar: {
    marginBottom: Spacing.lg,
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
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.errorViewColor,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.ButtonPrimaryColor,
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
  avatarLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
    marginTop: 2,
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
    justifyContent: 'space-between',
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
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsNormalText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#475569',
    lineHeight: 20,
  },
  termsLink: {
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginBottom: Spacing.xl,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default SignUpFirstScreen;
