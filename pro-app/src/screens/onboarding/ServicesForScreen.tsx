import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { useUser } from "../../context/UserContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ServicesFor">;

interface RoleOption {
  label: string;
  sub: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const roleOptions: RoleOption[] = [
  {
    label: "Barber / Hair Stylist Only",
    sub: "Provide professional haircuts, beard trimming, styling & grooming",
    value: 1,
    icon: "cut-outline",
  },
  {
    label: "Cleaning Pro Only",
    sub: "Provide home, apartment, office & premise cleaning services",
    value: 2,
    icon: "sparkles-outline",
  },
  {
    label: "Both (Barber / Stylist & Cleaning)",
    sub: "Offer both hair & grooming and specialized cleaning services",
    value: 3,
    icon: "apps-outline",
  },
];

export function ServicesForScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();
  const [selected, setSelected] = useState<number>(user.serviceFor && user.serviceFor > 0 ? user.serviceFor : 3);
  const [loading, setLoading] = useState(false);

  const isFromSettings =
    route.params?.isFromSettings || user.isSignUpCompleted;

  const submit = async () => {
    try {
      setLoading(true);
      await api.selectServiceFor({ serviceFor: selected, userType: 2 });
      await updateUser({ serviceFor: selected });

      if (isFromSettings) {
        showAlert("Success", "Your service role category has been updated.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("PersonalInfo");
        }
      } else {
        navigation.navigate("Services");
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("PersonalInfo");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Role Selection" onBackPress={handleBack} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading} />

        <Text style={styles.headerTitle}>What services will you offer?</Text>
        <Text style={styles.headerSubtitle}>
          Choose your primary professional category. You can customize exact services and pricing in the next step.
        </Text>

        <View style={styles.optionsList}>
          {roleOptions.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.iconCircle,
                    isSelected && styles.iconCircleSelected,
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={isSelected ? Colors.ButtonPrimaryColor : "#64748B"}
                  />
                </View>

                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Pinned Bottom Button */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isFromSettings ? "Update Service Role" : "Continue to Services"}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: Spacing.lg },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  optionsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#EEF4FF",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSelected: {
    backgroundColor: "#DBEAFE",
  },
  optionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 3,
  },
  optionTitleSelected: {
    color: Colors.ButtonPrimaryColor,
  },
  optionSub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    lineHeight: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.ButtonPrimaryColor,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
});


