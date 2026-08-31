import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>HL</Text>
        </View>
        <Text style={styles.title}>{t("appName")}</Text>
        <Text style={styles.subtitle}>{t("onboarding:completeProfile")}</Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title={t("auth:signIn")}
          onPress={() => navigation.navigate("SignIn", { mode: "signIn" })}
        />
        <View style={{ height: 12 }} />
        <Button
          title={t("auth:signUp")}
          variant="secondary"
          onPress={() => navigation.navigate("SignIn", { mode: "signUp" })}
        />
        <View style={{ height: 12 }} />
        <Button title="Continue with Apple" variant="ghost" onPress={() => socialSignIn("apple")} />
        <View style={{ height: 8 }} />
        <Button title="Continue with Facebook" variant="ghost" onPress={() => socialSignIn("facebook")} />
        <View style={{ height: 8 }} />
        <Button title="Continue with Google" variant="ghost" onPress={() => socialSignIn("google")} />
        <View style={{ height: 12 }} />
        <Button title={t("auth:guest")} variant="secondary" onPress={continueAsGuest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoContainer: { alignItems: "center", marginBottom: 36 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: { color: "#fff", fontSize: 36, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "700", color: "#333" },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
  buttons: { width: "100%" },
});
