import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ThankYou">;

export function ThankYouScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { updateUser } = useUser();

  const finish = async () => {
    await updateUser({ isSignUpCompleted: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
      </View>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.subtitle}>
        Your professional account setup is complete!
      </Text>
      <Text style={styles.description}>
        Your profile details, services, pricing, and availability have been saved. You can now start managing appointments and explore your partner dashboard.
      </Text>
      <Button
        title="Got It"
        onPress={finish}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  button: {
    width: "100%",
    minHeight: 54,
  },
});


