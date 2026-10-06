import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  Linking,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthStackParamList } from "../../navigation/types";
import { Colors } from "../../theme/colors";
import { Fonts, FontSizes, FontWeights } from "../../theme/fonts";
import { Spacing, BorderRadius } from "../../theme/spacing";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useUser } from "../../context/UserContext";
import { api } from "../../services/api";
import { TERMS_URL, PRIVACY_URL } from "../../constants";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export function SignInScreen({ route, navigation }: Props) {
  const initialMode = route.params?.mode ?? (route.params?.isSignUp ? "signUp" : "signIn");
  const { setAccount, setLoggedIn } = useUser();

  const [isSignUp, setIsSignUp] = useState(initialMode === "signUp");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState(route.params?.selectedCountryCode || "+1");
  const [flagEmoji, setFlagEmoji] = useState(route.params?.selectedFlag || "🇺🇸");
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    if (route.params?.selectedCountryCode) {
      setCountryCode(route.params.selectedCountryCode);
    }
    if (route.params?.selectedFlag) {
      setFlagEmoji(route.params.selectedFlag);
    }
  }, [route.params?.selectedCountryCode, route.params?.selectedFlag]);

  useEffect(() => {
    if (route.params?.mode) {
      setIsSignUp(route.params.mode === "signUp");
    } else if (route.params?.isSignUp !== undefined) {
      setIsSignUp(route.params.isSignUp);
    }
  }, [route.params?.mode, route.params?.isSignUp]);

  const handleSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) return;

    if (cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    if (isSignUp && !isForgotPassword && !isTermsAccepted) {
      setErrorMsg("Please accept terms & conditions to continue.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    try {
      if (isForgotPassword) {
        const res: any = await api.forgotPassword(cleanPhone);
        const verificationCode = res?.verificationCode ? String(res.verificationCode) : "";
        navigation.navigate("Verification", {
          countryCode,
          phoneNumber: cleanPhone,
          code: verificationCode,
          isSignUp: false,
          isForgotPassword: true,
        });
      } else if (isSignUp) {
        const res: any = await api.sendVerificationCode(cleanPhone, countryCode);
        const verificationCode = res?.verificationCode ? String(res.verificationCode) : "";
        navigation.navigate("Verification", {
          countryCode,
          phoneNumber: cleanPhone,
          code: verificationCode,
          isSignUp: true,
        });
      } else {
        const account = await api.signIn(cleanPhone, password, countryCode);
        if (account) {
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
          await setAccount(account, true);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return "Retrieve Password";
    if (isSignUp) return "Create Partner Account";
    return "Welcome Back";
  };

  const getSubtitle = () => {
    if (isForgotPassword) return "Enter your phone number to receive a verification code";
    if (isSignUp) return "Enter your phone number to get started with Hairlines Pro";
    return "Enter your mobile number and password to sign in";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LoadingOverlay visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Top Bar - Back Button */}
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

            {/* Title Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

            {/* Inline Error Banner */}
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

            {/* Input Form Fields */}
            <View style={styles.formCard}>
              {/* Phone Input Row */}
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <View style={styles.phoneRow}>
                {/* Country Code Picker Pill */}
                <TouchableOpacity
                  style={styles.countryCodePill}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("SelectCountry", {
                      selectedCode: countryCode,
                      returnScreen: isSignUp ? "SignUp" : "SignIn",
                    })
                  }
                >
                  <Text style={styles.flagEmoji}>{flagEmoji}</Text>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>

                {/* Phone Input Field */}
                <View style={styles.phoneInputFlex}>
                  <TextInput
                    placeholder="Phone Number (10 digits)"
                    placeholderTextColor="#94A3B8"
                    value={phoneNumber}
                    onChangeText={(text) =>
                      setPhoneNumber(text.replace(/\D/g, "").slice(0, 10))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                    style={styles.phoneInputText}
                  />
                </View>
              </View>

              {/* Password Input (Sign In mode only) */}
              {!isSignUp && !isForgotPassword && (
                <View style={styles.passwordWrapper}>
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.inputField}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setIsForgotPassword(true);
                      setErrorMsg("");
                    }}
                    style={styles.forgotButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Terms & Marketing Consent Checkbox (Sign Up mode only) */}
              {isSignUp && !isForgotPassword && (
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                    style={styles.checkboxTouch}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, isTermsAccepted && styles.checkboxActive]}>
                      {isTermsAccepted && <Ionicons name="checkmark" size={14} color={Colors.ButtonTextColor} />}
                    </View>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsNormalText}>
                        I agree to receive promotional and personalized marketing texts at the phone number provided above. Message frequency may vary. Standard message and data rates may apply. By opting in, you also agree to our{" "}
                        <Text
                          onPress={() => Linking.openURL(PRIVACY_URL)}
                          style={styles.termsLink}
                        >
                          Privacy Policy
                        </Text>{" "}
                        and{" "}
                        <Text
                          onPress={() => Linking.openURL(TERMS_URL)}
                          style={styles.termsLink}
                        >
                          Terms
                        </Text>{" "}
                        and Reply STOP to opt out.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Password Reset Back Link */}
              {isForgotPassword && (
                <TouchableOpacity
                  onPress={() => {
                    setIsForgotPassword(false);
                    setErrorMsg("");
                  }}
                  style={styles.forgotButtonLeft}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-back-circle-outline"
                    size={16}
                    color={Colors.ButtonPrimaryColor}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.forgotText}>Back to Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bottom Section - Submit Button & Footer Link */}
          <View style={styles.bottomSection}>
            <Button
              title={
                isForgotPassword
                  ? "SEND VERIFICATION CODE"
                  : isSignUp
                  ? "SIGN UP NOW"
                  : "SIGN IN"
              }
              onPress={handleSubmit}
              loading={loading}
              disabled={
                phoneNumber.replace(/\D/g, "").length !== 10 ||
                (isSignUp && !isTermsAccepted) ||
                (!isSignUp && !isForgotPassword && !password.trim())
              }
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />

            {!isForgotPassword && (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  {isSignUp
                    ? "Already have an account? "
                    : "Don't have an account? "}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg("");
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.footerLinkText}>
                    {isSignUp ? "SIGN IN" : "SIGN UP"}
                  </Text>
                </TouchableOpacity>
              </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  topSection: {
    width: "100%",
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
  formCard: {
    width: "100%",
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#334155",
    marginBottom: Spacing.xs,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  countryCodePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: "#0F172A",
    marginRight: 6,
  },
  phoneInputFlex: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    height: 52,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  phoneInputText: {
    fontSize: FontSizes.base,
    color: "#0F172A",
    padding: 0,
  },
  passwordWrapper: {
    marginBottom: Spacing.base,
  },
  inputField: {
    marginBottom: Spacing.xs,
  },
  forgotButton: {
    alignSelf: "flex-end",
    paddingVertical: Spacing.xs,
  },
  forgotButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  forgotText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
  termsContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  checkboxTouch: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsNormalText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "justify",
  },
  termsLink: {
    fontWeight: "bold",
    color: "#0F172A",
    textDecorationLine: "underline",
  },
  bottomSection: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  submitButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonTextColor,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.md,
    color: "#64748B",
  },
  footerLinkText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
});
