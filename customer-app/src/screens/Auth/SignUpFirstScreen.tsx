import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import { Genders } from '../../constants';
import * as ImagePicker from 'expo-image-picker';

import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUpFirst'>;
};

const SignUpFirstScreen: React.FC<Props> = ({ navigation }) => {
  const { account, setAccount } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [termsDescription, setTermsDescription] = useState('');
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  useEffect(() => {
    AuthApi.getTermsConditions()
      .then((res: any) => {
        if (res?.termAndConditionDescription) {
          setTermsDescription(res.termAndConditionDescription);
        }
      })
      .catch((err) => console.log('Failed to fetch terms:', err));
  }, []);

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
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
      const params = {
        countryCode: '+1',
        phoneNumber: account?.phoneNumber || '',
        userType: 1,
        deviceToken: 'simulator-device-token',
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Complete Your Profile</Text>

          {/* Profile Image */}
          <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📷</Text>
              </View>
            )}
            <Text style={styles.imageLabel}>Add Photo</Text>
          </TouchableOpacity>

          <VTTextField
            label="First Name"
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <VTTextField
            label="Last Name"
            placeholder="Enter last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          <VTTextField
            label="Email"
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Gender Selection */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            {['male', 'female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[styles.genderText, gender === g && styles.genderTextActive]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
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
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Agreement Checkbox */}
          <View style={styles.agreementRow}>
            <TouchableOpacity
              onPress={() => setIsTermsAccepted(!isTermsAccepted)}
              activeOpacity={0.8}
              style={[
                styles.checkbox,
                isTermsAccepted && styles.checkboxActive,
              ]}
            >
              {isTermsAccepted && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
            <View style={styles.agreementTextContainer}>
              <Text style={styles.agreementText}>
                I've read & agree with{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => setTermsModalVisible(true)}
                >
                  Terms & Conditions.
                </Text>
              </Text>
            </View>
          </View>

          <VTButton
            title="Complete Sign Up"
            onPress={handleSubmit}
            loading={loading}
            disabled={!firstName || !lastName || !email || !gender || !password || !confirmPassword}
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity
              onPress={() => setTermsModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text style={styles.modalBodyText}>
              {termsDescription
                ? termsDescription.replace(/<[^>]+>/g, '').trim()
                : 'Welcome to Hairlines. By signing up and booking services through Hairlines, you agree to treat our verified service professionals with respect, adhere to safety and hygiene protocols during appointments, maintain accurate booking and contact information, and comply with our transparent cancellation and refund policy.'}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <VTButton
              title="I Agree & Accept"
              onPress={() => {
                setIsTermsAccepted(true);
                setTermsModalVisible(false);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: FontSizes['2xl'],
    color: Colors.TitleColor,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.TextFieldColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.CardColor,
    borderStyle: 'dashed',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholderText: {
    fontSize: FontSizes['2xl'],
  },
  imageLabel: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
  },
  label: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.PlaceholderInactive,
    marginBottom: Spacing.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.base,
  },
  genderButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.TextFieldColor,
    borderRadius: 4,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
  },
  genderText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  genderTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontFamily: Fonts.uberMoveMedium,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
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
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    lineHeight: 20,
    fontFamily: Fonts.uberMoveRegular,
  },
  termsLink: {
    color: Colors.ButtonPrimaryColor,
    fontFamily: Fonts.uberMoveBold,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
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
    borderBottomColor: Colors.lightGrayBorder,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: FontSizes.lg,
    color: Colors.TitleColor,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  modalBodyText: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
    color: Colors.DescriptionTextDark,
    fontFamily: Fonts.uberMoveRegular,
  },
  modalFooter: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrayBorder,
    backgroundColor: Colors.BGColor,
  },
});

export default SignUpFirstScreen;
