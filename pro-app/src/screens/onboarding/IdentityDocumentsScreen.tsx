import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import * as ImagePicker from "expo-image-picker";
import { UploadImageType } from "../../constants";
import { Document } from "../../types/models";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "IdentityDocuments">;

export function IdentityDocumentsScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [types, setTypes] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);

  const isFromSettings =
    (route.params as any)?.isFromSettings || user.isSignUpCompleted;

  const DEFAULT_DOCUMENT_TYPES: Document[] = [
    { id: "1", name: "Driver's License (State DL)" },
    { id: "2", name: "Passport / International Passport" },
    { id: "3", name: "State Identification Card (State ID)" },
    { id: "4", name: "Permanent Resident Card (Green Card)" },
    { id: "5", name: "Work Authorization / Employment ID" },
  ];

  useEffect(() => {
    api
      .getAllDocumentTypes()
      .then((res: any) => {
        let docList: Document[] = [];
        if (Array.isArray(res)) {
          docList = res;
        } else if (Array.isArray(res?.documents)) {
          docList = res.documents;
        } else if (Array.isArray(res?.data)) {
          docList = res.data;
        } else if (Array.isArray(res?.documentList)) {
          docList = res.documentList;
        }

        // Normalize fields (id, _id, docId, name, documentName, title)
        const normalized: Document[] = docList
          .map((item: any) => ({
            id: String(item.id || item._id || item.docId || item.identityDocId || ""),
            name: String(item.name || item.documentName || item.docName || item.title || ""),
          }))
          .filter((item) => Boolean(item.id && item.name));

        const finalDocs = normalized.length > 0 ? normalized : DEFAULT_DOCUMENT_TYPES;
        setTypes(finalDocs);
        if (finalDocs.length > 0 && finalDocs[0].id) {
          setSelectedType(finalDocs[0].id);
        }
      })
      .catch((e) => {
        console.warn("getAllDocumentTypes fallback error:", e.message);
        setTypes(DEFAULT_DOCUMENT_TYPES);
        setSelectedType(DEFAULT_DOCUMENT_TYPES[0].id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedDocName =
    types.find((d) => d.id === selectedType)?.name || "Select Document Type";

  const pick = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!selectedType) {
      showAlert("Required", "Please select a document type from the dropdown.");
      return;
    }
    if (!front) {
      showAlert("Required", "Please upload the front image of your ID.");
      return;
    }
    try {
      setSubmitting(true);
      const frontUrl = await api.uploadImage(
        front,
        UploadImageType.identityDocumentsImages
      );
      const backUrl = back
        ? await api.uploadImage(back, UploadImageType.identityDocumentsImages)
        : "";
      await api.addIdentityDocument({
        identityDocId: selectedType,
        identityFront: frontUrl,
        identityBack: backUrl,
      });

      if (isFromSettings) {
        showAlert("Success", "Your identity verification documents have been updated.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Certificates");
        }
      } else {
        navigation.navigate("BankingLanguages");
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
      navigation.navigate("Certificates");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="ID Verification" onBackPress={handleBack} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading || submitting} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Government Photo ID</Text>
          <Text style={styles.headerSubtitle}>
            Select your ID type and upload clear photos for verification.
          </Text>
        </View>

        {/* Document Type Dropdown */}
        <Text style={styles.sectionHeading}>DOCUMENT TYPE</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownLeft}>
            <View style={styles.dropdownIconCircle}>
              <Ionicons
                name="id-card-outline"
                size={20}
                color={Colors.ButtonPrimaryColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dropdownLabel}>Selected Document</Text>
              <Text style={styles.dropdownValueText}>{selectedDocName}</Text>
            </View>
          </View>
          <Ionicons
            name="chevron-down"
            size={20}
            color={Colors.DescriptionTextDark}
          />
        </TouchableOpacity>

        {/* Upload Cards */}
        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
          DOCUMENT PHOTOS
        </Text>

        <View style={styles.card}>
          <Text style={styles.uploadCardTitle}>Front of Government ID</Text>
          <TouchableOpacity
            onPress={() => pick(setFront)}
            style={[styles.uploadBox, front && styles.uploadBoxFilled]}
            activeOpacity={0.8}
          >
            {front ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: front }} style={styles.imagePreview} />
                <View style={styles.changeBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                  <Text style={styles.changeBadgeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color={Colors.ButtonPrimaryColor}
                  />
                </View>
                <Text style={styles.uploadMainText}>Tap to Upload Front of ID</Text>
                <Text style={styles.uploadSubText}>Clear photo with all text visible</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.uploadCardTitle, { marginTop: Spacing.lg }]}>
            Back of Government ID (Optional)
          </Text>
          <TouchableOpacity
            onPress={() => pick(setBack)}
            style={[styles.uploadBox, back && styles.uploadBoxFilled]}
            activeOpacity={0.8}
          >
            {back ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: back }} style={styles.imagePreview} />
                <View style={styles.changeBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                  <Text style={styles.changeBadgeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color={Colors.ButtonPrimaryColor}
                  />
                </View>
                <Text style={styles.uploadMainText}>Tap to Upload Back of ID</Text>
                <Text style={styles.uploadSubText}>Optional if single-sided ID</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Main Save / Next Button Pinned at Bottom */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isFromSettings ? "Update Identity Documents" : t("common:next")}
          onPress={submit}
        />
      </View>

      {/* Document Type Selection Modal / Dropdown Sheet */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Document Type</Text>
              <TouchableOpacity
                onPress={() => setIsDropdownOpen(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={Colors.TitleColor} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={types}
              keyExtractor={(item) => item.id || ""}
              renderItem={({ item }) => {
                const isSelected = selectedType === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(item.id || "");
                      setIsDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownOptionLeft}>
                      <Ionicons
                        name="id-card-outline"
                        size={20}
                        color={isSelected ? Colors.ButtonPrimaryColor : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.ButtonPrimaryColor}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: Spacing.base },
  headerInfo: { marginBottom: Spacing.md },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.base,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dropdownIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownLabel: {
    fontSize: FontSizes.xs,
    color: "#64748B",
    fontWeight: FontWeights.medium,
    marginBottom: 2,
  },
  dropdownValueText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  uploadBox: {
    height: 160,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadBoxFilled: {
    borderStyle: "solid",
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#FFFFFF",
  },
  uploadPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.base,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadMainText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  uploadSubText: {
    fontSize: FontSizes.xs,
    color: "#94A3B8",
  },
  imagePreviewWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  changeBadgeText: {
    color: "#FFFFFF",
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.base,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  closeBtn: {
    padding: 4,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
  },
  dropdownOptionSelected: {
    backgroundColor: "#EEF4FF",
  },
  dropdownOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: FontSizes.base,
    color: Colors.TitleColor,
    fontWeight: FontWeights.medium,
  },
  dropdownOptionTextSelected: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
});


