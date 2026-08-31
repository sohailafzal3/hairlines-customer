import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";

type Props = DrawerScreenProps<MainDrawerParamList, "Wallet">;

export function WalletScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    api
      .getUserWallet()
      .then((res) => setBalance(res.walletAmount ?? 0))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header title={t("drawer:wallet")} onMenuPress={() => navigation.openDrawer()} />
      <View style={styles.content}>
        <Card>
          <Text style={styles.label}>Available Balance</Text>
          <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        </Card>
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16 },
  label: { fontSize: 14, color: "#777" },
  balance: { fontSize: 36, fontWeight: "700", color: "#2E7D32", marginTop: 8 },
});
