import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { JobDetail, LineItem } from "../../../types";

type Props = NativeStackScreenProps<HomeTabParamList, "CostBreakdown">;

export function CostBreakdownScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { jobId } = route.params;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const detail = await api.getJobDetail(jobId);
      setJob(detail);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  const addLineItem = async () => {
    if (!itemName || !itemPrice) return;
    try {
      setLoading(true);
      await api.addLineItem(jobId, {
        itemName,
        itemPrice: parseFloat(itemPrice),
        itemQuantity: 1,
      });
      setItemName("");
      setItemPrice("");
      await load();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (item: LineItem) => {
    try {
      setLoading(true);
      await api.deleteLineItem(jobId, item.id || "");
      await load();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const breakdown = job?.costBreakDown;
  return (
    <View style={styles.container}>
      <Header title={t("job:costBreakdown")} onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.total}>
            {formatCurrency(breakdown?.totalAmount, breakdown?.currency)}
          </Text>
          <Text style={styles.row}>
            Service charges: {formatCurrency(breakdown?.serviceCharges, breakdown?.currency)}
          </Text>
          <Text style={styles.row}>
            Line items: {formatCurrency(breakdown?.totalLineItemAmount, breakdown?.currency)}
          </Text>
          <Text style={styles.row}>
            Discount: {formatCurrency(breakdown?.discountAmount, breakdown?.currency)}
          </Text>
        </Card>

        <Text style={styles.section}>{t("job:lineItems")}</Text>
        {breakdown?.lineItems?.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemQty}>Qty: {item.itemQuantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.itemPrice, breakdown?.currency)}
              </Text>
              <TouchableOpacity onPress={() => removeItem(item)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        <Text style={styles.section}>{t("job:addLineItem")}</Text>
        <Input label="Item Name" value={itemName} onChangeText={setItemName} />
        <Input
          label="Price"
          keyboardType="decimal-pad"
          value={itemPrice}
          onChangeText={setItemPrice}
        />
        <Button title={t("job:addLineItem")} onPress={addLineItem} />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 32 },
  total: { fontSize: 26, fontWeight: "700", color: "#2E7D32", marginBottom: 12 },
  row: { fontSize: 14, color: "#555", marginTop: 4 },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  itemCard: { paddingVertical: 10, paddingHorizontal: 14 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemQty: { fontSize: 12, color: "#999" },
  itemPrice: { flex: 1, textAlign: "right", fontWeight: "700" },
  remove: { color: "#C62828", fontSize: 16, marginLeft: 12, fontWeight: "700" },
});
