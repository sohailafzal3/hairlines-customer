import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { useUser } from "../../../context/UserContext";
import * as Clipboard from "expo-clipboard";
import { showAlert } from "../../../utils/helpers";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = NativeStackScreenProps<MainDrawerParamList, "ShareReferral">;

export function ShareReferralScreen({ navigation }: Props) {
  const { user } = useUser();
  const code = user.referralCode || "HAIRPRO";

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    showAlert("Copied", `Referral code "${code}" copied to clipboard!`);
  };

  const share = async () => {
    const message = `Join Hairlines Pro using my partner code ${code} and get exclusive signup bonuses! https://hairlines.app`;
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({
            title: "Hairlines Pro Referral",
            text: message,
          });
        } else {
          await Clipboard.setStringAsync(code);
          showAlert(
            "Referral Code",
            `Referral code "${code}" copied to clipboard!`
          );
        }
      } else {
        await Share.share({
          message,
          title: "Hairlines Pro Referral",
        });
      }
    } catch (error: any) {
      if (
        error.message &&
        !error.message.includes("dismissed") &&
        !error.message.includes("canceled")
      ) {
        showAlert("Notice", error.message);
      }
    }
  };

  const handleBack = () => {
    navigation.navigate("Wallet");
  };

  return (
    <View style={styles.container}>
      <Header title="Invite & Earn" onBackPress={handleBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.iconCircle}>
          <Ionicons name="gift" size={36} color={Colors.ButtonPrimaryColor} />
        </View>

        <Text style={styles.title}>Invite Stylists & Barbers</Text>
        <Text style={styles.subtitle}>
          Share your partner code with fellow beauty professionals. Earn bonus commission rewards when they complete their first bookings!
        </Text>

        {/* Code Box */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR UNIQUE REFERRAL CODE</Text>
          <Text style={styles.code}>{code}</Text>

          <TouchableOpacity style={styles.copyPill} onPress={copy} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={14} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
            <Text style={styles.copyPillText}>Tap to Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <Button title="Share Referral Code" onPress={share} style={{ width: "100%" }} />
        <View style={{ height: 12 }} />
        <Button title="Copy to Clipboard" variant="secondary" onPress={copy} style={{ width: "100%" }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  codeCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: "#EEF4FF",
    borderStyle: "dashed",
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  codeLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  code: {
    fontSize: FontSizes["3xl"] + 2,
    fontWeight: FontWeights.heavy,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  copyPillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
});

