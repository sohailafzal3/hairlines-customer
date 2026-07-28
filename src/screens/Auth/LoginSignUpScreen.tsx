import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton } from '../../components/common';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'LoginSignUp'>;
};

const LoginSignUpScreen: React.FC<Props> = ({ navigation }) => {
  const handleFacebookSignUp = () => {
    console.log('Facebook sign-in initiated');
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

        {/* Bottom Actions Section (Directly on screen background) */}
        <View style={styles.bottomSection}>
          {/* Create Account / Sign Up Button */}
          <VTButton
            title="Create an Account"
            onPress={() => navigation.navigate('SignIn', { isSignUp: true })}
            style={styles.signUpButton}
            textStyle={styles.signUpButtonText}
          />

          {/* Facebook Button Stacked Below */}
          <TouchableOpacity
            style={styles.facebookButton}
            onPress={handleFacebookSignUp}
            activeOpacity={0.85}
          >
            <FontAwesome name="facebook" size={20} color="#FFFFFF" style={styles.socialIcon} />
            <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>

          {/* Bottom Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignIn', { isSignUp: false })}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.signInLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: Spacing.md,
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
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  facebookButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveMedium,
    color: '#FFFFFF',
  },
  socialIcon: {
    marginRight: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  signInLinkText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
});

export default LoginSignUpScreen;
