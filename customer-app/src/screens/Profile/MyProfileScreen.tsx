import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { useAuthStore } from '../../store';
import { MyProfile } from '../../models';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyProfile'>;
};

const MyProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setAccount, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const {
    data: profile,
    loading,
    execute: fetchProfile,
  } = useApi<MyProfile>(ProfileApi.fetchProfile);

  const { execute: updateProfile, loading: updating } = useApi(ProfileApi.editProfile);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileImage(profile.profileImage || '');
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
      setPhone(`${profile.phonePreFix || ''} ${profile.phoneNumber || ''}`.trim());
      setAddress(profile.residanceAddress?.primaryAddress || '');
    }
  }, [profile]);

  const loadProfile = async () => {
    await fetchProfile();
  };

  const handleImagePick = async () => {
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
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        firstName,
        lastName,
        profileImageUrl: profileImage,
        email,
        isPhysicallyDisabled: profile?.isPhysicallyDisabled || 'none',
        gender: profile?.gender || '',
        dateOfBirth: profile?.dateOfBirth || '',
        residanceName: profile?.residanceName || '',
        instituteName: profile?.instituteName || '',
        residanceAddress: address,
        residanceStreetAddress: '',
        residanceLatitude: 0,
        residanceLongitude: 0,
      });
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your account details have been saved.',
      });
      setIsEditing(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Could not update profile details.',
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your Hairlines account? This action cannot be undone.',
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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

        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7} style={styles.editTouch}>
          <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
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
        >
          {/* Avatar Banner */}
          <View style={styles.avatarCard}>
            <TouchableOpacity
              onPress={isEditing ? handleImagePick : undefined}
              disabled={!isEditing}
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
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.nameText}>
              {profile?.name || `${firstName} ${lastName}`.trim() || 'User Profile'}
            </Text>

            {profile?.avgRating ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#EAB308" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>{profile.avgRating.toFixed(1)} Rating</Text>
              </View>
            ) : null}
          </View>

          {/* Profile Inputs */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>

            <View style={styles.rowFields}>
              <VTTextField
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                editable={isEditing}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
              <VTTextField
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                editable={isEditing}
                autoCapitalize="words"
                style={styles.flexHalf}
              />
            </View>

            <VTTextField
              label="Email Address"
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

            <VTTextField
              label="Primary Address"
              value={address}
              onChangeText={setAddress}
              editable={isEditing}
              leftIcon={<Ionicons name="location-outline" size={18} color="#64748B" />}
            />

            {isEditing && (
              <VTButton
                title="Save Changes"
                onPress={handleSave}
                loading={updating}
                style={styles.saveButton}
                textStyle={styles.saveButtonText}
              />
            )}
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>ACCOUNT MANAGEMENT</Text>
            <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <VTLoading visible={loading} />
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
    padding: 6,
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
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
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
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.md,
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
