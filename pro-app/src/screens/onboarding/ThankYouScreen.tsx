import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { useUser } from "../../context/UserContext";

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
        <Ionicons name="checkmark-circle" size={56} color="#10B981" />
      </View>
      <Text style={styles.title}>{t("onboarding:thankYou")}</Text>
      <Text style={styles.subtitle}>
        Your professional profile has been submitted and is under review. You can start exploring the dashboard now!
      </Text>
      <Button title={t("common:done")} onPress={finish} style={{ width: "100%" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#222D63", marginBottom: 12 },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
});

