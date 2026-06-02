import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import { Genders } from '../../constants';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUpFirst'>;
};

const SignUpFirstScreen: React.FC<Props> = ({ navigation }) => {
  const { account } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const params = {
        countryCode: '+1',
        phoneNumber: account?.phoneNumber || '',
        userType: 1,
        deviceToken: '0000000000000000000000000000000000000000000000000000000000000000', // Structurally valid 64-char hex token for AWS SNS
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
      console.error('Signup error:', error.message);
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

          <VTButton
            title="Complete Sign Up"
            onPress={handleSubmit}
            loading={loading}
            disabled={!firstName || !lastName || !email || !gender || !password || !confirmPassword}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  button: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
});

export default SignUpFirstScreen;
