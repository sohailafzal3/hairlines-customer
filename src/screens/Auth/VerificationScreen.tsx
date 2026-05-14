import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Verification'>;
  route: RouteProp<AuthStackParamList, 'Verification'>;
};

const VerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { countryCode, phoneNumber, isSignUp, isForgotPassword } = route.params;
  const { setAccount, setLoggedIn } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
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
    setTimer(60);
    try {
      await AuthApi.sendVerificationCode(countryCode, phoneNumber);
    } catch (error) {
      console.error('Resend error:', error);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) return;

    setLoading(true);
    try {
      const deviceToken = 'simulator-device-token';

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
      console.error('Verification error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = code.every((c) => c.length === 1);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code sent to {countryCode} {phoneNumber}
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: any) => (inputs.current[index] = ref)}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <VTButton
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={!isComplete}
            style={styles.button}
          />

          {timer > 0 ? (
            <Text style={styles.timerText}>Resend code in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
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
  content: {
    flex: 1,
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.CardColor,
    backgroundColor: Colors.TextFieldColor,
    textAlign: 'center',
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  button: {
    marginTop: Spacing.lg,
  },
  timerText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  resendText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
  },
});

export default VerificationScreen;
