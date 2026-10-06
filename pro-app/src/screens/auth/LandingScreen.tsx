import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Colors } from "../../theme/colors";
import { Fonts, FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<AuthStackParamList, "Landing">;

export function LandingScreen({ navigation }: Props) {
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
              name="sparkles-sharp"
              size={12}
              color="#854D0E"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.featurePillText}>PROFESSIONAL PARTNER NETWORK</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            Manage your clients, appointments, and earnings seamlessly. Join top barbers & salon professionals.
          </Text>
        </View>

        {/* Flexible spacer */}
        <View style={styles.spacer} />

        {/* Bottom Actions Section */}
        <View style={styles.bottomSection}>
          <Button
            title="SIGN UP NOW"
            onPress={() => navigation.navigate("SignIn", { mode: "signUp", isSignUp: true })}
            style={styles.signUpButton}
          />

          <View style={{ height: 12 }} />

          <Button
            title="SIGN IN"
            variant="ghost"
            onPress={() => navigation.navigate("SignIn", { mode: "signIn", isSignUp: false })}
          />

          {/* Existing account link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("SignIn", { mode: "signIn", isSignUp: false })}
            style={styles.accountTouch}
            activeOpacity={0.7}
          >
            <Text style={styles.accountPrompt}>Already have a partner account? </Text>
            <Text style={styles.accountLink}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  ambientCircleTopRight: {
    position: "absolute",
    top: -90,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(229, 182, 82, 0.10)",
  },
  ambientCircleBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(34, 45, 99, 0.06)",
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
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#222D63",
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
    fontFamily: Fonts.uberMoveBold,
    fontWeight: FontWeights.heavy,
    color: "#0F172A",
    letterSpacing: 3,
    marginBottom: Spacing.xs,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9EE",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: "rgba(229, 182, 82, 0.35)",
  },
  featurePillText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    width: "100%",
  },
  signUpButton: {
    minHeight: 54,
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
  },
  accountTouch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    marginTop: Spacing.base,
  },
  accountPrompt: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: "#64748B",
  },
  accountLink: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
    textDecorationLine: "underline",
  },
});


