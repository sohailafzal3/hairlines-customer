import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { useAuthStore } from '../../store';
import { MyProfile } from '../../models';
import * as ImagePicker from 'expo-image-picker';

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
      setPhone(`${profile.phonePreFix} ${profile.phoneNumber}`);
      setAddress(profile.residanceAddress?.primaryAddress || '');
    }
  }, [profile]);

  const loadProfile = async () => {
    await fetchProfile();
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
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
      setIsEditing(false);
    } catch (error: any) {
      console.error('Update error:', error.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Image */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={isEditing ? handleImagePick : undefined} disabled={!isEditing}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {firstName?.charAt(0) || 'U'}
                  {lastName?.charAt(0) || ''}
                </Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.editIconContainer}>
                <Text style={styles.editIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.nameText}>
            {profile?.name || `${firstName} ${lastName}`}
          </Text>
          {profile?.avgRating ? (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {profile.avgRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <VTTextField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditing}
            autoCapitalize="words"
          />
          <VTTextField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            editable={isEditing}
            autoCapitalize="words"
          />
          <VTTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <VTTextField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            editable={false}
            keyboardType="phone-pad"
          />
          <VTTextField
            label="Address"
            value={address}
            onChangeText={setAddress}
            editable={isEditing}
            multiline
            numberOfLines={2}
          />
        </View>

        {isEditing && (
          <VTButton
            title="Save Changes"
            onPress={handleSave}
            loading={updating}
            style={styles.saveButton}
          />
        )}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <VTLoading visible={loading} />
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
  menuIcon: {
    fontSize: FontSizes.xl,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  editText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
  },
  editIconContainer: {
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
    borderColor: Colors.BGColor,
  },
  editIcon: {
    fontSize: FontSizes.sm,
  },
  nameText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
    marginTop: Spacing.md,
  },
  ratingContainer: {
    marginTop: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.RadioActive,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginBottom: Spacing.xl,
  },
  dangerSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.CardColor,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  deleteText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.errorViewColor,
  },
});

export default MyProfileScreen;
