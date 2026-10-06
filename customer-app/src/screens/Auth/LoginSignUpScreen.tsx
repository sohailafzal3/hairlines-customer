import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';
import Toast from 'react-native-toast-message';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton } from '../../components/common';
import { AuthApi } from '../../api';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = '900005747944732';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'LoginSignUp'>;
};

const LoginSignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [fbLoading, setFbLoading] = useState(false);
  const { setAccount, setUser, setLoggedIn } = useAuthStore();

  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    responseType: ResponseType.Token,
    scopes: ['public_profile', 'email'],
  });

  const processFacebookAuth = async (accessToken: string) => {
    setFbLoading(true);
    try {
      const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';
      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      const account = await AuthApi.facebookAuth(accessToken, deviceToken, deviceType);

      if (account) {
        setAccount(account);

        if (account.isSignUpCompleted) {
          setUser(account as any);
          setLoggedIn(true);
          await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
          Toast.show({
            type: 'success',
            text1: 'Welcome back!',
            text2: `Signed in as ${account.firstName || account.name || 'User'}`,
          });
        } else if (account.isPhoneNumberRequired) {
          Toast.show({
            type: 'info',
            text1: 'Almost Done',
            text2: 'Please link your mobile phone number to complete setup.',
          });
          navigation.navigate('SignIn', { isSignUp: true });
        } else {
          Toast.show({
            type: 'info',
            text1: 'Almost Done',
            text2: 'Please complete your profile details.',
          });
          navigation.navigate('SignUpFirst');
        }
      }
    } catch (error: any) {
      console.error('Facebook auth API error:', error);
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Could not verify Facebook credentials with server.';
      Toast.show({
        type: 'error',
        text1: 'Facebook Sign In Failed',
        text2: errMsg,
      });
    } finally {
      setFbLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken =
        response.params?.access_token || (response as any).authentication?.accessToken;
      if (accessToken) {
        processFacebookAuth(accessToken);
      }
    } else if (response?.type === 'error') {
      Toast.show({
        type: 'error',
        text1: 'Facebook Sign In Failed',
        text2: response.error?.message || 'Authentication error.',
      });
    }
  }, [response]);

  const handleFacebookLogin = async () => {
    try {
      setFbLoading(true);
      const result = await promptAsync();
      if (result.type === 'success') {
        const accessToken =
          result.params?.access_token || (result as any).authentication?.accessToken;
        if (accessToken) {
          await processFacebookAuth(accessToken);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Facebook Sign In',
            text2: 'Failed to retrieve Facebook access token.',
          });
          setFbLoading(false);
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        setFbLoading(false);
      } else if (result.type === 'error') {
        Toast.show({
          type: 'error',
          text1: 'Facebook Sign In Failed',
          text2: result.error?.message || 'Authentication error.',
        });
        setFbLoading(false);
      } else {
        setFbLoading(false);
      }
    } catch (error: any) {
      console.error('Facebook login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Facebook Sign In Error',
        text2: error?.message || 'Could not open Facebook login.',
      });
      setFbLoading(false);
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
            title="SIGN UP NOW"
            onPress={() => navigation.navigate('SignIn', { isSignUp: true })}
            style={styles.signUpButton}
            textStyle={styles.signUpButtonText}
          />

          {/* Facebook sign-in */}
          <TouchableOpacity
            style={[styles.facebookButton, fbLoading && styles.facebookButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleFacebookLogin}
            disabled={fbLoading || !request}
          >
            {fbLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome name="facebook" size={22} color="#FFFFFF" />
                <Text style={styles.facebookText}>Sign In with Facebook</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Existing account link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn', { isSignUp: false })}
            style={styles.accountTouch}
            activeOpacity={0.7}
          >
            <Text style={styles.accountPrompt}>Already have an account? </Text>
            <Text style={styles.accountLink}>SIGN IN</Text>
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
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    minHeight: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#4A6BAA',
    marginBottom: Spacing.lg,
    elevation: 2,
  },
  facebookButtonDisabled: {
    opacity: 0.7,
  },
  facebookText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
  },
  accountTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  accountPrompt: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#A0A0A0',
  },
  accountLink: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    textDecorationLine: 'underline',
  },
});

export default LoginSignUpScreen;
