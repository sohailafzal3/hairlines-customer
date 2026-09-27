import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';
import { VTButton } from '../../components/common';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'LoginSignUp'>;
};

const LoginSignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { setAccount, setLoggedIn } = useAuthStore();

  const handleGuestLogin = async () => {
    try {
      const deviceToken = 'simulator-device-token'; // Replace with actual push token
      const account = await AuthApi.signUpGuest({
        countryCode: '+1',
        phoneNumber: '',
        deviceToken,
        deviceType: 'ios',
      });
      if (account) {
        setAccount(account);
        setLoggedIn(true);
        await Storage.setItem(STORAGE_KEYS.kIsGuestUserLoggedIn, 'true');
        await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
      }
    } catch (error) {
      console.error('Guest login error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.BGColor} />
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>HL</Text>
          </View>
          <Text style={styles.tagline}>Book services at your fingertips</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <VTButton
            title="Sign Up"
            onPress={() => navigation.navigate('SignIn', { isSignUp: true })}
            style={styles.button}
          />
          <VTButton
            title="Sign In"
            variant="outline"
            onPress={() => navigation.navigate('SignIn', { isSignUp: false })}
            style={styles.button}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>🍎</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleGuestLogin} style={styles.guestButton}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginBottom: Spacing.base,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.CardColor,
  },
  dividerText: {
    marginHorizontal: Spacing.base,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.TextFieldColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  socialIcon: {
    fontSize: FontSizes.lg,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  guestText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
    textDecorationLine: 'underline',
  },
});

export default LoginSignUpScreen;
