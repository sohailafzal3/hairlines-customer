import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useUser } from "../../context/UserContext";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";

type Props = NativeStackScreenProps<AuthStackParamList, "Verification">;

export function VerificationScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { phoneNumber, countryCode, isSignUp } = route.params;
  const { setAccount, setLoggedIn } = useUser();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.length < 4) {
      showAlert(t("validation:required"));
      return;
    }
    try {
      setLoading(true);
      const account = await api.verifyCode(
        phoneNumber,
        countryCode,
        code,
        isSignUp
      );
      await setAccount(account);
      await setLoggedIn(true);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("auth:verificationCode")}</Text>
      <Text style={styles.subtitle}>
        {t("auth:enterCode")} {countryCode} {phoneNumber}
      </Text>
      <Input
        placeholder="1234"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <Button title={t("common:submit")} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginBottom: 24,
  },
});
