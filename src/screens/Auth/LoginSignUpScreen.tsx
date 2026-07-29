import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
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
      const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
      const account = await AuthApi.signUpGuest({
        countryCode: '+1',
        phoneNumber: '',
        deviceToken,
        deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Decorative Background Ambient Circles */}
      <View style={styles.ambientCircleTopRight} />
      <View style={styles.ambientCircleBottomLeft} />

      <View style={styles.content}>
        {/* Top Header / Branding Section */}
        <View style={styles.header}>
          {/* Logo Badge */}
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="content-cut" size={38} color="#FFFFFF" />
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={14} color="#E5B652" />
              </View>
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>HAIRLINES</Text>

          {/* Feature Pill */}
          <View style={styles.featurePill}>
            <Ionicons name="sparkles-sharp" size={12} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
            <Text style={styles.featurePillText}>PREMIER BEAUTY & GROOMING</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            Elevate your style. Book top barbers & salon professionals near you in seconds.
          </Text>
        </View>

        {/* Flexible spacer to push buttons to bottom */}
        <View style={styles.spacer} />

        {/* Bottom Actions Section */}
        <View style={styles.bottomSection}>
          {/* Sign Up Button */}
          <VTButton
            title="Sign Up"
            onPress={() => navigation.navigate('SignIn', { isSignUp: true })}
            style={styles.signUpButton}
            textStyle={styles.signUpButtonText}
          />

          {/* Sign In Button */}
          <VTButton
            title="Sign In"
            variant="outline"
            onPress={() => navigation.navigate('SignIn', { isSignUp: false })}
            style={styles.signInButton}
            textStyle={styles.signInButtonText}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Row */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <FontAwesome name="facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <FontAwesome name="google" size={20} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialCircle} activeOpacity={0.8}>
              <FontAwesome name="apple" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Guest Link */}
          <TouchableOpacity onPress={handleGuestLogin} style={styles.guestTouch} activeOpacity={0.7}>
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
    backgroundColor: '#F8FAFC',
  },
  ambientCircleTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(34, 45, 99, 0.08)',
  },
  ambientCircleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(43, 118, 200, 0.07)',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  logoBadgeContainer: {
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E5B652',
  },
  appName: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.12)',
  },
  featurePillText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    width: '100%',
  },
  signUpButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginBottom: Spacing.sm,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  signInButton: {
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginBottom: Spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  signInButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: '#94A3B8',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  socialCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  guestTouch: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  guestText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    textDecorationLine: 'underline',
  },
});

export default LoginSignUpScreen;

export default LoginSignUpScreen;
