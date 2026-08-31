import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import * as ImagePicker from "expo-image-picker";
import { UploadImageType } from "../../constants";
import { Document } from "../../types/models";

type Props = NativeStackScreenProps<OnboardingStackParamList, "IdentityDocuments">;

export function IdentityDocumentsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAllDocumentTypes()
      .then((res) => setTypes(res.documents ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const pick = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const submit = async () => {
    if (!selectedType || !front) {
      showAlert(t("validation:required"));
      return;
    }
    try {
      setLoading(true);
      const frontUrl = await api.uploadImage(front, UploadImageType.identityDocumentsImages);
      const backUrl = back
        ? await api.uploadImage(back, UploadImageType.identityDocumentsImages)
        : "";
      await api.addIdentityDocument({
        identityDocId: selectedType,
        identityFront: frontUrl,
        identityBack: backUrl,
      });
      navigation.navigate("BankingLanguages");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("onboarding:identity")}</Text>
      <Text style={styles.label}>Document Type</Text>
      {types.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            styles.typeRow,
            selectedType === doc.id && styles.typeRowSelected,
          ]}
          onPress={() => setSelectedType(doc.id || "")}
        >
          <Text style={styles.typeText}>{doc.name}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => pick(setFront)} style={styles.imageBox}>
        {front ? (
          <Image source={{ uri: front }} style={styles.image} />
        ) : (
          <Text style={styles.imageLabel}>Front Image</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => pick(setBack)} style={styles.imageBox}>
        {back ? (
          <Image source={{ uri: back }} style={styles.image} />
        ) : (
          <Text style={styles.imageLabel}>Back Image (optional)</Text>
        )}
      </TouchableOpacity>
      <Button title={t("common:next")} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#333" },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8, color: "#333" },
  typeRow: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 8,
  },
  typeRowSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },
  typeText: { fontSize: 15, color: "#333" },
  imageBox: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  imageLabel: { color: "#777" },
});
