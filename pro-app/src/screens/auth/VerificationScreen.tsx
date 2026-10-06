import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthStackParamList } from "../../navigation/types";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { Spacing, BorderRadius } from "../../theme/spacing";
import { Button } from "../../components/Button";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useUser } from "../../context/UserContext";
import { api } from "../../services/api";

type Props = NativeStackScreenProps<AuthStackParamList, "Verification">;

export function VerificationScreen({ route, navigation }: Props) {
  const { phoneNumber, countryCode, isSignUp, isForgotPassword, code: incomingCode } = route.params;
  const { setAccount, setLoggedIn } = useUser();

  const getInitialCode = () => {
    if (incomingCode) {
      const cleaned = String(incomingCode).replace(/\D/g, "");
      if (cleaned.length >= 4) {
        return cleaned.slice(0, 4).split("");
      }
    }
    return ["", "", "", ""];
  };

  const [code, setCode] = useState<string[]>(getInitialCode);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (incomingCode) {
      const cleaned = String(incomingCode).replace(/\D/g, "");
      if (cleaned.length >= 4) {
        setCode(cleaned.slice(0, 4).split(""));
      }
    }
  }, [incomingCode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 4).split("");
      const newCode = ["", "", "", ""];
      digits.forEach((d, i) => {
        newCode[i] = d;
      });
      setCode(newCode);
      inputs.current[Math.min(digits.length - 1, 3)]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);

    if (cleaned && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    setErrorMsg("");
    setTimer(60);
    try {
      let res: any;
      if (isForgotPassword) {
        res = await api.forgotPassword(phoneNumber);
      } else {
        res = await api.sendVerificationCode(phoneNumber, countryCode);
      }
      if (res?.verificationCode) {
        const cleaned = String(res.verificationCode).replace(/\D/g, "");
        if (cleaned.length >= 4) {
          setCode(cleaned.slice(0, 4).split(""));
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to resend verification code.");
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 4) return;

    setErrorMsg("");
    setLoading(true);
    try {
      const account = await api.verifyCode(
        phoneNumber,
        countryCode,
        fullCode,
        isSignUp
      );
      if (account) {
        account.phoneNumber = account.phoneNumber || phoneNumber;
        account.countryCode = account.countryCode || countryCode || "+1";
        account.phoneCode = account.phoneCode || countryCode || "+1";

        if (isSignUp) {
          // For new signups, ALWAYS start onboarding at Step 0 (PersonalInfo)
          const raw = account as any;
          raw.isSignUpCompleted = false;
          raw.isSignupCompleted = false;
          raw.isProfileCompleted = false;
          raw.isSpProfileCompleted = false;
          raw.signUpStepCompleted = 0;
          raw.stepCompleted = 0;
          raw.isApproved = false;
          raw.isVerifiedByAdmin = false;
          raw.isSpApproved = false;
          if (raw.userData) {
            raw.userData.isSignUpCompleted = false;
            raw.userData.isSignupCompleted = false;
            raw.userData.signUpStepCompleted = 0;
            raw.userData.stepCompleted = 0;
            raw.userData.isApproved = false;
            raw.userData.isVerifiedByAdmin = false;
            raw.userData.isSpApproved = false;
          }
        } else {
          const raw = account as any;
          const userObj = raw.userData || raw.user || raw;
          const isExplicitlyIncomplete =
            raw.isSignupCompleted === false ||
            raw.isSignUpCompleted === false ||
            userObj.isSignupCompleted === false ||
            userObj.isSignUpCompleted === false ||
            (typeof raw.signUpStepCompleted === "number" && raw.signUpStepCompleted >= 0 && raw.signUpStepCompleted < 7) ||
            (typeof userObj.signUpStepCompleted === "number" && userObj.signUpStepCompleted >= 0 && userObj.signUpStepCompleted < 7) ||
            (typeof raw.stepCompleted === "number" && raw.stepCompleted >= 0 && raw.stepCompleted < 7) ||
            (typeof userObj.stepCompleted === "number" && userObj.stepCompleted >= 0 && userObj.stepCompleted < 7);

          if (!isExplicitlyIncomplete) {
            raw.isSignUpCompleted = true;
            raw.isSignupCompleted = true;
            if (raw.signUpStepCompleted === undefined && raw.stepCompleted === undefined) {
              raw.signUpStepCompleted = 7;
            }
          }
        }
        await setAccount(account, true);
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isComplete = code.every((c) => c.length === 1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LoadingOverlay visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate("Landing" as any);
              }}
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
              We sent a 4-digit code to{" "}
              <Text style={styles.phoneHighlight}>
                {countryCode} {phoneNumber}
              </Text>
            </Text>
          </View>

          {/* Error Banner */}
          {!!errorMsg && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={Colors.errorViewColor}
                style={{ marginRight: 6 }}
              />
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
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
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
          <Button
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
              <TouchableOpacity
                onPress={handleResend}
                style={styles.resendTouch}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reload-outline"
                  size={16}
                  color={Colors.ButtonPrimaryColor}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.bold,
    color: "#0F172A",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: "#64748B",
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: FontWeights.bold,
    color: "#0F172A",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.errorViewColor,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  codeInput: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: "#0F172A",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  codeInputFilled: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "rgba(229, 182, 82, 0.10)",
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
    fontWeight: FontWeights.bold,
    color: Colors.ButtonTextColor,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  timerText: {
    fontSize: FontSizes.md,
    color: "#64748B",
  },
  timerBold: {
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
  resendTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
});
