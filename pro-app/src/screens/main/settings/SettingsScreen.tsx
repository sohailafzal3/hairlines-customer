import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";


type Props = DrawerScreenProps<MainDrawerParamList, "Settings">;

const rows = [
  { label: "Tools & Equipment", icon: "hammer-outline" },
  { label: "Edit Services", icon: "cut-outline" },
  { label: "Manage Workers", icon: "people-outline" },
  { label: "Share & Referral", icon: "share-outline" },
  { label: "Contact Support", icon: "headset-outline" },
];

export function SettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const handlePress = (label: string) => {
    switch (label) {
      case "Tools & Equipment":
        navigation.navigate("HomeTab", { screen: "ToolsAndEquipment" } as any);
        break;
      case "Edit Services":
        navigation.navigate("HomeTab", { screen: "ServicesSelection", params: {} } as any);
        break;
      case "Manage Workers":
        navigation.navigate("Workers");
        break;
      case "Contact Support":
        navigation.navigate("Support");
        break;
      case "Share & Referral":
        navigation.navigate("ShareReferral");
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t("drawer:settings")} onMenuPress={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {rows.map((row, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handlePress(row.label)}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name={row.icon as any} size={20} color={Colors.ButtonPrimaryColor} />
              </View>
              <Text style={styles.label}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: { padding: Spacing.base },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.TitleColor,
  },
});

