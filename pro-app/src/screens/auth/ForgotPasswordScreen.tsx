import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(route.params?.phoneNumber ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone) {
      showAlert(t("validation:required"));
      return;
    }
    try {
      setLoading(true);
      await api.forgotPassword(phone);
      showAlert("Success", "A temporary password has been sent.");
      navigation.goBack();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("auth:forgotPassword")}</Text>
      <Input
        label={t("auth:phoneNumber")}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
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
    marginBottom: 24,
  },
});
