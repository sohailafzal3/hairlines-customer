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
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { Spacing, BorderRadius } from "../../theme/spacing";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ route, navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phoneNumber ?? "");
  const [countryCode, setCountryCode] = useState(route.params?.selectedCountryCode || "+1");
  const [flagEmoji, setFlagEmoji] = useState(route.params?.selectedFlag || "🇺🇸");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (route.params?.selectedCountryCode) {
      setCountryCode(route.params.selectedCountryCode);
    }
    if (route.params?.selectedFlag) {
      setFlagEmoji(route.params.selectedFlag);
    }
  }, [route.params?.selectedCountryCode, route.params?.selectedFlag]);

  const handleSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) return;

    if (cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res: any = await api.forgotPassword(cleanPhone);
      const verificationCode = res?.verificationCode ? String(res.verificationCode) : "";
      setSuccessMsg("Verification code sent successfully.");
      navigation.navigate("Verification", {
        countryCode,
        phoneNumber: cleanPhone,
        code: verificationCode,
        isSignUp: false,
        isForgotPassword: true,
      });
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
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
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
              </TouchableOpacity>
            </View>

            {/* Title Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Retrieve Password</Text>
              <Text style={styles.subtitle}>
                Enter your registered mobile phone number to receive reset instructions
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

            {/* Success Banner */}
            {!!successMsg && (
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#059669"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.successBannerText}>{successMsg}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <View style={styles.phoneRow}>
                {/* Country Code Picker Pill */}
                <TouchableOpacity
                  style={styles.countryCodePill}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("SelectCountry", {
                      selectedCode: countryCode,
                      returnScreen: "ForgotPassword",
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
            </View>
          </View>

          {/* Bottom Section - Submit Button & Footer Link */}
          <View style={styles.bottomSection}>
            <Button
              title="Send Reset Instructions"
              onPress={handleSubmit}
              loading={loading}
              disabled={phoneNumber.replace(/\D/g, "").length !== 10}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate("SignIn", { mode: "signIn" })}
                style={styles.backToSignInTouch}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back-circle-outline"
                  size={18}
                  color={Colors.ButtonPrimaryColor}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.backToSignInText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
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
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  successBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#059669",
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
    color: "#FFFFFF",
  },
  footerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  backToSignInTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  backToSignInText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
});
