import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useUser } from "../../context/UserContext";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import {
  signInWithApple,
  signInWithFacebook,
  signInWithGoogle,
} from "../../services/socialAuth";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<AuthStackParamList, "Landing">;

export function LandingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setAccount, setLoggedIn } = useUser();
  const [loading, setLoading] = React.useState(false);

  const continueAsGuest = async () => {
    try {
      setLoading(true);
      const account = await api.signUpGuest();
      await setAccount(account);
      await setLoggedIn(true);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const socialSignIn = async (provider: "apple" | "facebook" | "google") => {
    try {
      setLoading(true);
      let result;
      if (provider === "apple") result = await signInWithApple();
      else if (provider === "facebook") result = await signInWithFacebook();
      else result = await signInWithGoogle();

      const account =
        provider === "apple"
          ? await api.appleSignup({
              identityToken: result.token,
              email: result.email,
              name: result.name,
              userType: 2,
            })
          : await api.facebookSignup({
              accessToken: result.token,
              userType: 2,
            });

      await setAccount(account);
      await setLoggedIn(true);
    } catch (e: any) {
      showAlert("Social Sign-In", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />

      {/* Decorative Background Ambient Circles */}
      <View style={styles.ambientCircleTopRight} />
      <View style={styles.ambientCircleBottomLeft} />

      <View style={styles.content}>
        {/* Top Header / Branding Section */}
        <View style={styles.header}>
          {/* Logo Badge */}
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="content-cut" size={40} color="#FFFFFF" />
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={13} color={Colors.gold} />
              </View>
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>HAIRLINES</Text>

          {/* Feature Pill */}
          <View style={styles.featurePill}>
            <Ionicons
              name="shield-checkmark"
              size={12}
              color={Colors.ButtonPrimaryColor}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.featurePillText}>PROFESSIONAL PARTNER NETWORK</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            Manage your clients, appointments, and earnings seamlessly. Join thousands of verified stylists & barbers.
          </Text>
        </View>

        {/* Flexible spacer */}
        <View style={styles.spacer} />

        {/* Bottom Actions Section */}
        <View style={styles.bottomSection}>
          <Button
            title="SIGN IN TO PRO"
            onPress={() => navigation.navigate("SignIn", { mode: "signIn" })}
            style={styles.signInButton}
          />

          <View style={{ height: 10 }} />

          <Button
            title="JOIN AS A PARTNER"
            variant="secondary"
            onPress={() => navigation.navigate("SignIn", { mode: "signUp" })}
          />

          {/* Social Sign In Options */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => socialSignIn("google")}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => socialSignIn("apple")}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={18} color="#0F172A" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => socialSignIn("facebook")}
              activeOpacity={0.8}
            >
              <FontAwesome name="facebook" size={18} color="#1877F2" />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Mode */}
          <TouchableOpacity
            style={styles.guestLink}
            onPress={continueAsGuest}
            activeOpacity={0.7}
          >
            <Text style={styles.guestLinkText}>Explore as Guest Partner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  ambientCircleTopRight: {
    position: "absolute",
    top: -90,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(34, 45, 99, 0.08)",
  },
  ambientCircleBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(43, 118, 200, 0.07)",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  logoBadgeContainer: {
    marginBottom: Spacing.base,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    position: "relative",
  },
  sparkleBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  appName: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.heavy,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
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
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    width: "100%",
  },
  signInButton: {
    marginBottom: 2,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  socialIconBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    paddingVertical: 11,
    shadowColor: "#0F172A",
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
    alignItems: "center",
    paddingVertical: Spacing.sm,
    marginTop: 4,
  },
  guestLinkText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.DescriptionTextDark,
  },
});

