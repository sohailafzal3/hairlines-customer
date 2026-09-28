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
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { ProfileApi, AuthApi, UploadApi } from '../../api';
import { useAuthStore } from '../../store';
import { MyProfile } from '../../models';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'MyProfile'>;
};

const MyProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
        residanceAddress: address,
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation.getParent() as any)?.openDrawer?.()}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          <VTTextField
            label="Primary Address"
            placeholder="Address for home visits"
            value={address}
            onChangeText={setAddress}
            editable={isEditing}
          />
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
    </SafeAreaView>
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
});

export default MyProfileScreen;
