import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { Document } from "../../types/models";

type Props = NativeStackScreenProps<OnboardingStackParamList, "BankingLanguages">;

export function BankingLanguagesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ssn, setSsn] = useState("");
  const [languages, setLanguages] = useState<Document[]>([]);
  const [levels, setLevels] = useState<Document[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  useEffect(() => {
    Promise.all([api.getActiveLanguages(), api.getLanguageLevels()])
      .then(([l, lv]) => {
        setLanguages(l.languageList ?? []);
        setLevels(lv.languageLevelList ?? []);
      })
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    try {
      setLoading(true);
      await api.addBankInfo("bank_token_placeholder", ssn);
      navigation.navigate("Availability");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("onboarding:banking")}</Text>
      <Input label="Account Holder Name" value={accountName} onChangeText={setAccountName} />
      <Input label="Routing Number" value={routingNumber} onChangeText={setRoutingNumber} />
      <Input label="Account Number" value={accountNumber} onChangeText={setAccountNumber} />
      <Input label="SSN Last 4" maxLength={4} value={ssn} onChangeText={setSsn} />

      <Text style={styles.section}>Languages</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.id}
          style={[
            styles.row,
            selectedLang === lang.id && styles.rowSelected,
          ]}
          onPress={() => setSelectedLang(lang.id || "")}
        >
          <Text style={styles.rowText}>{lang.name}</Text>
        </TouchableOpacity>
      ))}
      {levels.map((lvl) => (
        <TouchableOpacity
          key={lvl.id}
          style={[
            styles.row,
            selectedLevel === lvl.id && styles.rowSelected,
          ]}
          onPress={() => setSelectedLevel(lvl.id || "")}
        >
          <Text style={styles.rowText}>{lvl.name}</Text>
        </TouchableOpacity>
      ))}
      <Button title={t("common:next")} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#333" },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  row: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 8,
  },
  rowSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },
  rowText: { fontSize: 15, color: "#333" },
});
