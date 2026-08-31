import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Ionicons } from "@expo/vector-icons";

type Props = DrawerScreenProps<MainDrawerParamList, "Settings">;

const rows = [
  { label: "Job Availability", icon: "time-outline", screen: "" },
  { label: "Tools & Equipment", icon: "hammer-outline", screen: "" },
  { label: "Edit Services", icon: "cut-outline", screen: "" },
  { label: "Banking Details", icon: "card-outline", screen: "" },
  { label: "Photo ID", icon: "id-card-outline", screen: "" },
  { label: "Professional License", icon: "document-outline", screen: "" },
];

export function SettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Header title={t("drawer:settings")} onMenuPress={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row, i) => (
          <TouchableOpacity key={i} style={styles.row}>
            <Ionicons name={row.icon as any} size={22} color="#555" />
            <Text style={styles.label}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  label: { flex: 1, fontSize: 16, color: "#333", marginLeft: 12 },
});
