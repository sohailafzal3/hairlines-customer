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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUpFirst'>;
};

const SignUpFirstScreen: React.FC<Props> = ({ navigation }) => {
  const { account } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImagePick = async () => {
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
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter password.');
      return;
    }

    setLoading(true);
    try {
      const params = {
        countryCode: '+1',
        phoneNumber: account?.phoneNumber || '',
        userType: 1,
        deviceToken: '0000000000000000000000000000000000000000000000000000000000000000',
        deviceType: 'ios',
        email: email.toLowerCase(),
        firstName,
        lastName,
        profileImageUrl: profileImage,
        referralCode: '',
        isPhysicallyDisabled: 'none',
        gender,
        dateOfBirth,
        password,
        residanceName: '',
        instituteName: '',
        residanceAddress: '',
        residanceStreetAddress: '',
        residanceLatitude: 0,
        residanceLongitude: 0,
      };
      await AuthApi.basicInfo(params);
      navigation.navigate('ThankYou');
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrorMsg(error.message || 'Failed to complete sign up. Please try again.');
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
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Help us personalize your service experience</Text>
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
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Upload Profile Photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.rowFields}>
              <VTTextField
                label="First Name"
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
              <VTTextField
                label="Last Name"
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
            </View>

            <VTTextField
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Gender Selection Segment */}
            <Text style={styles.genderLabel}>Gender</Text>
            <View style={styles.genderSegmentRow}>
              {[
                { key: 'male', label: 'Male', icon: 'male' },
                { key: 'female', label: 'Female', icon: 'female' },
              ].map((item) => {
                const isActive = gender === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.genderCard, isActive && styles.genderCardActive]}
                    onPress={() => setGender(item.key)}
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

            <VTTextField
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
            />

            <VTTextField
              label="Password"
              placeholder="Create password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <VTTextField
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <VTButton
              title="Complete Sign Up"
              onPress={handleSubmit}
              loading={loading}
              disabled={!firstName || !lastName || !email || !gender || !password || !confirmPassword}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
          </View>
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
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: Colors.ButtonPrimaryColor,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
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
  formContainer: {
    width: '100%',
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  genderLabel: {
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
    borderWidth: 1,
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
  submitButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.lg,
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
