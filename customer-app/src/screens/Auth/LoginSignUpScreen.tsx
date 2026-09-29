import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button, LoadingOverlay } from '../../components';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'LoginSignUp'>;
};

const LoginSignUpScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { loginGuest } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      const deviceToken = 'simulator-device-token';
      const account = await AuthApi.signUpGuest({
        countryCode: '+1',
        phoneNumber: '',
        deviceToken,
        deviceType: 'ios',
      });
      if (account) {
        Toast.show({
          type: 'success',
          text1: 'Welcome',
          text2: 'Logged in as Guest',
        });
        await loginGuest(account);
      }
    } catch (error: any) {
      console.error('Guest login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Guest Login Failed',
        text2: error?.message || 'Unable to continue as guest',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    Toast.show({
      type: 'info',
      text1: `${provider} Sign-In`,
      text2: `Connecting to ${provider}...`,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.ScreenBG} />
      <LoadingOverlay visible={loading} />

      {/* Ambient background decoration */}
      <View style={styles.ambientCircleTopRight} />
      <View style={styles.ambientCircleBottomLeft} />

      <View style={styles.content}>
        {/* Top Header / Branding Section */}
        <View style={styles.header}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="content-cut" size={42} color="#FFFFFF" />
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.gold} />
              </View>
            </View>
          </View>

          <Text style={styles.appName}>HAIRLINES</Text>

          <View style={styles.featurePill}>
            <Ionicons
              name="sparkles"
              size={11}
              color={Colors.ButtonPrimaryColor}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.featurePillText}>ON-DEMAND BEAUTY & WELLNESS</Text>
          </View>

          <Text style={styles.tagline}>
            Book top-rated barbers, stylists, and wellness professionals directly to your doorstep.
          </Text>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons Section */}
        <View style={styles.bottomSection}>
          <Button
            title="SIGN IN"
            onPress={() => navigation.navigate('SignIn', { isSignUp: false })}
            style={styles.signInButton}
          />

          <View style={{ height: 10 }} />

          <Button
            title="CREATE AN ACCOUNT"
            variant="secondary"
            onPress={() => navigation.navigate('SignIn', { isSignUp: true })}
          />

          {/* Social Sign In */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => handleSocialAuth('Google')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => handleSocialAuth('Apple')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={18} color="#0F172A" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => handleSocialAuth('Facebook')}
              activeOpacity={0.8}
            >
              <FontAwesome name="facebook" size={18} color="#1877F2" />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleGuestLogin} style={styles.guestLink} activeOpacity={0.7}>
            <Text style={styles.guestLinkText}>Explore as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
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
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  logoBadgeContainer: {
    marginBottom: Spacing.base,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  appName: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.heavy,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.base,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    width: '100%',
  },
  signInButton: {
    marginBottom: 2,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  socialIconBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    paddingVertical: 11,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  socialBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: 4,
  },
  guestLinkText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.DescriptionTextDark,
  },
});

export default LoginSignUpScreen;

