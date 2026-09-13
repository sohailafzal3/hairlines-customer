import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="headset" size={32} color={Colors.ButtonPrimaryColor} />
          </View>
          <Text style={styles.title}>We're Here to Help</Text>
          <Text style={styles.subtitle}>
            Have questions about bookings, payments, or client services? Reach out to our dedicated support team.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => open(`tel:${info.phone}`)}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconBox}>
            <Ionicons name="call-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Phone Support</Text>
            <Text style={styles.cardValue}>{info.phone || "1-800-HAIRLINES"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => open(`mailto:${info.email}`)}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconBox}>
            <Ionicons name="mail-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Email Support</Text>
            <Text style={styles.cardValue}>{info.email || "support@hairlines.com"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => open(info.website || "https://hairlines.com")}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconBox}>
            <Ionicons name="globe-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>Official Website</Text>
            <Text style={styles.cardValue}>{info.website || "www.hairlines.com"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  headerBox: {
    alignItems: "center",
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
  },
});

