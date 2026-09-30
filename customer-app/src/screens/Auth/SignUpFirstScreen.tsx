import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button, Input, LoadingOverlay } from '../../components';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import { getDeviceToken } from '../../services/notifications';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUpFirst'>;
};

const SignUpFirstScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { account, setAccount } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [termsDescription, setTermsDescription] = useState('');
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setTermsLoading(true);
      const res: any = await AuthApi.getTermsConditions();
      const text =
        res?.termAndConditionDescription ||
        res?.data?.termAndConditionDescription ||
        res?.terms ||
        res?.data?.terms ||
        res?.termsAndConditions ||
        res?.data?.termsAndConditions ||
        res?.description ||
        (typeof res === 'string' ? res : '');
      if (text) {
        setTermsDescription(text);
      }
    } catch (err) {
      console.log('Failed to fetch terms:', err);
    } finally {
      setTermsLoading(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'info',
        text1: 'Permission Needed',
        text2: 'Please allow access to your photo library to set a profile photo.',
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

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (!isTermsAccepted) {
      Toast.show({
        type: 'error',
        text1: 'Terms Required',
        text2: 'Please accept Terms & Conditions before continuing',
      });
      return;
    }

    setLoading(true);
    try {
      const deviceToken = await getDeviceToken();
      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      const params = {
        countryCode: '+1',
        phoneNumber: account?.phoneNumber || '',
        userType: 1,
        deviceToken,
        deviceType,
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileImageUrl: profileImage,
        referralCode: '',
        isPhysicallyDisabled: 0,
        gender,
        dateOfBirth: 0,
        password,
        residanceName: '',
        instituteName: '',
        residanceAddress: '',
        residanceStreetAddress: '',
        residanceLatitude: 0,
        residanceLongitude: 0,
      };
      const createdAccount = await AuthApi.basicInfo(params);
      if (createdAccount) {
        setAccount(createdAccount);
      }
      navigation.navigate('ThankYou');
    } catch (error: any) {
      console.error('Signup error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: error?.message || 'Could not complete registration',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.ScreenBG} />
      <LoadingOverlay visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
          </TouchableOpacity>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Enter your details to create your Hairlines customer profile</Text>

          {/* Profile Image Picker */}
          <View style={styles.imagePickerWrapper}>
            <TouchableOpacity onPress={handleImagePick} style={styles.avatarTouchable} activeOpacity={0.8}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={Colors.DescriptionTextDark} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageLabel}>Add Profile Photo</Text>
          </View>

          {/* Name Row */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="First Name"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Last Name"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Input
            label="Email Address"
            placeholder="john.doe@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Gender Selection */}
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.genderContainer}>
            {[
              { key: 'male', label: 'Male', icon: 'male' },
              { key: 'female', label: 'Female', icon: 'female' },
            ].map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.genderButton, gender === g.key && styles.genderButtonActive]}
                onPress={() => setGender(g.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={g.icon as any}
                  size={16}
                  color={gender === g.key ? Colors.ButtonPrimaryColor : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.genderText, gender === g.key && styles.genderTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Date of Birth (Optional)"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />

          <Input
            label="Password"
            placeholder="Create password (min 6 chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Agreement Checkbox — matches iOS "I've read & agree with Terms & Conditions." */}
          <TouchableOpacity
            style={styles.agreementRow}
            activeOpacity={0.8}
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
          >
            <View style={[styles.checkbox, isTermsAccepted && styles.checkboxActive]}>
              {isTermsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <View style={styles.agreementTextContainer}>
              <Text style={styles.agreementText}>
                {"I've read & agree with "}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!termsDescription) {
                      fetchTerms();
                    }
                    setTermsModalVisible(true);
                  }}
                >
                  Terms & Conditions
                </Text>
                {'.'}
              </Text>
            </View>
          </TouchableOpacity>

          <Button
            title="Complete Registration"
            onPress={handleSubmit}
            loading={loading}
            disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Ionicons name="document-text-outline" size={22} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
            </View>
            <TouchableOpacity
              onPress={() => setTermsModalVisible(false)}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={Colors.TitleColor} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {termsLoading ? (
              <View style={styles.termsLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.ButtonPrimaryColor} />
                <Text style={styles.termsLoadingText}>Loading latest terms...</Text>
              </View>
            ) : (
              <Text style={styles.modalBodyText}>
                {termsDescription
                  ? termsDescription.replace(/<[^>]+>/g, '').trim()
                  : 'Welcome to Hairlines. By signing up and booking services through Hairlines, you agree to treat our verified service professionals with respect, adhere to safety and hygiene protocols during appointments, maintain accurate booking and contact information, and comply with our transparent cancellation and refund policy.'}
              </Text>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button
              title="I Understand & Accept"
              onPress={() => {
                setIsTermsAccepted(true);
                setTermsModalVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: '#64748B',
    marginBottom: Spacing.lg,
  },
  imagePickerWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarTouchable: {
    position: 'relative',
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  imageLabel: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.ButtonPrimaryColor,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: '#334155',
    marginBottom: Spacing.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.base,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
  },
  genderButtonActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  genderText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: '#64748B',
  },
  genderTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
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
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  termsLink: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: Spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
    backgroundColor: '#FFFFFF',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  termsLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsLoadingText: {
    marginTop: 12,
    fontSize: FontSizes.sm,
    color: '#64748B',
  },
  modalBodyText: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
    color: Colors.DescriptionTextDark,
  },
  modalFooter: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderColor,
    backgroundColor: '#FFFFFF',
  },
});

export default SignUpFirstScreen;

