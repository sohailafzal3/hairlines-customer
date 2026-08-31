import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { useUser } from "../../../context/UserContext";
import * as Clipboard from "expo-clipboard";
import { showAlert } from "../../../utils/helpers";
import * as Sharing from "expo-sharing";

type Props = NativeStackScreenProps<MainDrawerParamList, "ShareReferral">;

export function ShareReferralScreen({ navigation }: Props) {
  const { user } = useUser();
  const code = user.referralCode || "N/A";

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    showAlert("Copied", "Referral code copied to clipboard");
  };

  const share = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(`Use my referral code ${code} on Hairlines Pro!`);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Share & Get Discount" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.label}>Your Referral Code</Text>
        <Text style={styles.code}>{code}</Text>
        <Button title="Copy Code" onPress={copy} />
        <View style={{ height: 12 }} />
        <Button title="Share" variant="secondary" onPress={share} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, alignItems: "center" },
  label: { fontSize: 16, color: "#777" },
  code: {
    fontSize: 36,
    fontWeight: "800",
    color: "#2E7D32",
    marginVertical: 24,
    letterSpacing: 2,
  },
});
