import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { Document } from "../../types/models";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "BankingLanguages">;

export function BankingLanguagesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ssn, setSsn] = useState("");
  const [languages, setLanguages] = useState<Document[]>([]);
  const [levels, setLevels] = useState<Document[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const isFromSettings =
    route.params?.isFromSettings || user.isSignUpCompleted;

  useEffect(() => {
    Promise.all([
      api.getActiveLanguages().catch(() => ({ languageList: [] })),
      api.getLanguageLevels().catch(() => ({ languageLevelList: [] })),
    ])
      .then(([l, lv]) => {
        const langList = l.languageList ?? [];
        const lvlList = lv.languageLevelList ?? [];
        setLanguages(langList);
        setLevels(lvlList);
        if (langList.length > 0 && langList[0].id) setSelectedLang(langList[0].id);
        if (lvlList.length > 0 && lvlList[0].id) setSelectedLevel(lvlList[0].id);
      })
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!accountName.trim()) {
      showAlert("Required", "Please enter the account holder name.");
      return;
    }
    if (!routingNumber.trim() || routingNumber.trim().length < 9) {
      showAlert("Required", "Please enter a valid 9-digit routing number.");
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 4) {
      showAlert("Required", "Please enter a valid bank account number.");
      return;
    }
    if (!ssn.trim() || ssn.trim().length < 4) {
      showAlert("Required", "Please enter the last 4 digits of your SSN / Tax ID.");
      return;
    }

    try {
      setSubmitting(true);
      await api.addBankInfo("bank_token_placeholder", ssn.trim());

      if (isFromSettings) {
        showAlert("Success", "Your banking payout details have been updated.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Services");
        }
      } else {
        navigation.navigate("Availability");
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Services");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Account Details" onBackPress={handleBack} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading || submitting} />

        <Text style={styles.headerTitle}>Payout & Account Details</Text>
        <Text style={styles.headerSubtitle}>
          Provide your bank account details for direct payouts and set your communication preferences.
        </Text>

        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Bank Payout Information</Text>

          <Input
            label="Account Holder Name"
            placeholder="John Doe"
            value={accountName}
            onChangeText={setAccountName}
            autoCapitalize="words"
          />

          <Input
            label="Routing Number"
            placeholder="9-Digit Routing Number"
            value={routingNumber}
            onChangeText={setRoutingNumber}
            keyboardType="number-pad"
            maxLength={9}
          />

          <Input
            label="Account Number"
            placeholder="Bank Account Number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
          />

          <Input
            label="SSN (Last 4 Digits)"
            placeholder="e.g. 1234"
            maxLength={4}
            value={ssn}
            onChangeText={setSsn}
            keyboardType="number-pad"
          />
        </View>

        {languages.length > 0 && (
          <View style={styles.cardSection}>
            <Text style={styles.cardSectionTitle}>Preferred Language</Text>
            <View style={styles.chipGrid}>
              {languages.map((lang) => {
                const isSel = selectedLang === lang.id;
                return (
                  <TouchableOpacity
                    key={lang.id}
                    style={[styles.chip, isSel && styles.chipSelected]}
                    onPress={() => setSelectedLang(lang.id || "")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {levels.length > 0 && (
          <View style={styles.cardSection}>
            <Text style={styles.cardSectionTitle}>Proficiency Level</Text>
            <View style={styles.chipGrid}>
              {levels.map((lvl) => {
                const isSel = selectedLevel === lvl.id;
                return (
                  <TouchableOpacity
                    key={lvl.id}
                    style={[styles.chip, isSel && styles.chipSelected]}
                    onPress={() => setSelectedLevel(lvl.id || "")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTextSelected]}>
                      {lvl.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Pinned Bottom Action Button */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isFromSettings ? "Update Payout Details" : "Continue to Availability"}
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
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.md,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipSelected: {
    backgroundColor: "#EEF4FF",
    borderColor: Colors.ButtonPrimaryColor,
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
    fontWeight: FontWeights.medium,
  },
  chipTextSelected: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
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


