import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useUser } from "../../context/UserContext";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export function SignInScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const mode = route.params?.mode ?? "signIn";
  const isSignUp = mode === "signUp";
  const { setAccount, setLoggedIn } = useUser();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const countryCode = "+1";

  const submit = async () => {
    if (!phone || (!isSignUp && !password)) {
      showAlert(t("validation:required"));
      return;
    }
    try {
      setLoading(true);
      if (isSignUp) {
        await api.sendVerificationCode(phone, countryCode);
        navigation.navigate("Verification", {
          phoneNumber: phone,
          countryCode,
          code: "",
          isSignUp: true,
        });
      } else {
        const account = await api.signIn(phone, password, countryCode);
        await setAccount(account);
        await setLoggedIn(true);
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{isSignUp ? t("auth:signUp") : t("auth:signIn")}</Text>
      <Input
        label={t("auth:phoneNumber")}
        placeholder="512345678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      {!isSignUp && (
        <Input
          label={t("auth:password")}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}
      <Button title={isSignUp ? "Continue" : t("auth:signIn")} onPress={submit} />

      <View style={styles.footer}>
        {!isSignUp && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ForgotPassword", { phoneNumber: phone })
            }
          >
            <Text style={styles.link}>{t("auth:forgotPassword")}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() =>
            navigation.setParams({ mode: isSignUp ? "signIn" : "signUp" })
          }
        >
          <Text style={styles.link}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
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
  footer: { marginTop: 20, alignItems: "center" },
  link: {
    color: "#2E7D32",
    fontSize: 14,
    marginVertical: 6,
    fontWeight: "500",
  },
});
