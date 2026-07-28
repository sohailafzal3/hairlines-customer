import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Verification'>;
  route: RouteProp<AuthStackParamList, 'Verification'>;
};

const VerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { countryCode, phoneNumber, isSignUp, isForgotPassword } = route.params;
  const { setAccount, setLoggedIn } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setTimer(60);
    try {
      await AuthApi.sendVerificationCode(countryCode, phoneNumber);
    } catch (error: any) {
      console.error('Resend error:', error);
      setErrorMsg(error.message || 'Failed to resend verification code.');
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) return;

    setErrorMsg('');
    setLoading(true);
    try {
      const deviceToken = '0000000000000000000000000000000000000000000000000000000000000000';

      if (isSignUp) {
        const account = await AuthApi.verifyCode({
          countryCode,
          phoneNumber,
          code: fullCode,
          deviceToken,
          deviceType: 'ios',
        });
        if (account) {
          setAccount(account);
          if (account.isSignUpCompleted) {
            setLoggedIn(true);
            await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
          } else {
            navigation.navigate('SignUpFirst');
          }
        }
      } else {
        const account = await AuthApi.verifySignInCode({
          countryCode,
          phoneNumber,
          code: fullCode,
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
      console.error('Verification error:', error);
      setErrorMsg(error.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = code.every((c) => c.length === 1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
            </TouchableOpacity>
          </View>

          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 4-digit code to{' '}
              <Text style={styles.phoneHighlight}>
                {countryCode} {phoneNumber}
              </Text>
            </Text>
          </View>

          {/* Error Banner */}
          {!!errorMsg && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.errorViewColor} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* OTP Digit Row */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => {
              const isFilled = digit.length > 0;
              return (
                <TextInput
                  key={index}
                  ref={(ref: any) => (inputs.current[index] = ref)}
                  style={[styles.codeInput, isFilled && styles.codeInputFilled]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              );
            })}
          </View>

          {/* Verify Button */}
          <VTButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={loading}
            disabled={!isComplete}
            style={styles.verifyButton}
            textStyle={styles.verifyButtonText}
          />

          {/* Resend Timer / Link */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerBold}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} style={styles.resendTouch} activeOpacity={0.7}>
                <Ionicons name="reload-outline" size={16} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  topBar: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.errorViewColor,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  codeInput: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  codeInputFilled: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  verifyButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  timerText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  timerBold: {
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  resendTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
});

export default VerificationScreen;
