import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
  route: RouteProp<AuthStackParamList, 'SignIn'>;
};

const SignInScreen: React.FC<Props> = ({ navigation, route }) => {
  const { isSignUp } = route.params;
  const { setAccount, setLoggedIn } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      const deviceToken = 'simulator-device-token';

      if (isForgotPassword) {
        await AuthApi.forgotPassword({
          countryCode,
          phoneNumber,
          deviceToken,
          deviceType: 'ios',
        });
        navigation.navigate('Verification', {
          countryCode,
          phoneNumber,
          isSignUp: false,
          isForgotPassword: true,
        });
      } else if (isSignUp) {
        await AuthApi.sendVerificationCode(countryCode, phoneNumber);
        navigation.navigate('Verification', {
          countryCode,
          phoneNumber,
          isSignUp: true,
        });
      } else {
        const account = await AuthApi.signIn({
          countryCode,
          phoneNumber,
          password,
          deviceToken,
          deviceType: 'ios',
        });
        if (account) {
          setAccount(account);
          setLoggedIn(true);
          await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error.message);
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
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {isForgotPassword
              ? 'Retrieve Password'
              : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
          </Text>
          <Text style={styles.subtitle}>
            {isForgotPassword
              ? 'Enter your phone number to receive a verification code'
              : isSignUp
              ? 'Enter your phone number to get started'
              : 'Welcome back! Enter your credentials'}
          </Text>

          {/* Phone Input */}
          <View style={styles.phoneContainer}>
            <TouchableOpacity style={styles.countryCode}>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            <VTTextField
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              inputStyle={styles.phoneInputText}
            />
          </View>

          {/* Password (only for sign in) */}
          {!isSignUp && !isForgotPassword && (
            <VTTextField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          )}

          <VTButton
            title={isForgotPassword ? 'Send Code' : isSignUp ? 'Continue' : 'Sign In'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!phoneNumber.trim() || (!isSignUp && !isForgotPassword && !password.trim())}
            style={styles.button}
          />

          {/* Toggle forgot password */}
          {!isSignUp && !isForgotPassword && (
            <TouchableOpacity
              onPress={() => setIsForgotPassword(true)}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {isForgotPassword && (
            <TouchableOpacity
              onPress={() => setIsForgotPassword(false)}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Back to Sign In</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.xl,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.TextFieldColor,
    borderRadius: 4,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginRight: Spacing.sm,
    minHeight: 48,
  },
  countryCodeText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginRight: Spacing.xs,
  },
  dropdownIcon: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextLight,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  phoneInputText: {
    fontSize: FontSizes.base,
  },
  input: {
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.lg,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  forgotText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
  },
});

export default SignInScreen;
