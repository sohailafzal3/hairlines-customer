import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";

type Props = NativeStackScreenProps<MainDrawerParamList, "Support">;

export function ContactSupportScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    api
      .getContactInfo()
      .then((res) => setInfo(res))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const open = (url?: string) => url && Linking.openURL(url);

  return (
    <View style={styles.container}>
      <Header title="Contact Support" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => open(`tel:${info.phone}`)}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{info.phone || "N/A"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => open(`mailto:${info.email}`)}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{info.email || "N/A"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => open(info.website)}>
          <Text style={styles.label}>Website</Text>
          <Text style={styles.value}>{info.website || "N/A"}</Text>
        </TouchableOpacity>
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24 },
  label: { fontSize: 13, color: "#999", marginTop: 16 },
  value: { fontSize: 16, color: "#2E7D32", marginTop: 4, fontWeight: "500" },
});
