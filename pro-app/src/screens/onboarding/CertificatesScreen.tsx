import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import * as ImagePicker from "expo-image-picker";
import { UploadImageType } from "../../constants";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Certificates">;

export function CertificatesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("");
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);

  const pick = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const submit = async () => {
    try {
      setLoading(true);
      const frontUrl = front
        ? await api.uploadImage(front, UploadImageType.certificates)
        : "";
      const backUrl = back
        ? await api.uploadImage(back, UploadImageType.certificates)
        : "";
      await api.updateServicePreference({
        professionalLicenseDocuments: [
          {
            professionalDocsTitle: title,
            professionalDocsFront: frontUrl,
            professionalDocsBack: backUrl,
            expiryDate: expiry,
          },
        ],
      });
      navigation.navigate("IdentityDocuments");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("onboarding:certificates")}</Text>
      <Input label="License Title" value={title} onChangeText={setTitle} />
      <Input label="Expiry Date (YYYY-MM-DD)" value={expiry} onChangeText={setExpiry} />
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
  imageBox: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  imageLabel: { color: "#777" },
});
