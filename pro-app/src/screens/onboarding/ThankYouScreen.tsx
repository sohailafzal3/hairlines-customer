import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
      <Text style={styles.title}>{t("onboarding:thankYou")}</Text>
      <Text style={styles.subtitle}>
        Your profile is under review. You can start exploring the app now.
      </Text>
      <Button title={t("common:done")} onPress={finish} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "700", color: "#2E7D32", marginBottom: 16 },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
});
