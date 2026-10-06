import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import * as ImagePicker from "expo-image-picker";
import { UploadImageType } from "../../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";
import { navigationRef } from "../../navigation/navigationRef";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Certificates">;

export function CertificatesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);

  // Customer / Service type: 0 = Normal only, 1 = Disabled only, 2 = Both
  const customerType =
    typeof user.serviceFor === "number" && user.serviceFor >= 0
      ? user.serviceFor
      : 2;

  // Document Photos (matches iOS drivingLicenseImages[0] and drivingLicenseImages[1])
  const [front1, setFront1] = useState<string | null>(null);
  const [front2, setFront2] = useState<string | null>(null);

  // Expiry Date (matches iOS documentExpiry Double Unix timestamp in seconds)
  const [expiryFormatted, setExpiryFormatted] = useState<string>("");
  const [expiryTimestamp, setExpiryTimestamp] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState<Date>(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isFromSettings =
    (route.params as any)?.isFromSettings || user.isSignUpCompleted;

  useEffect(() => {
    // Pre-populate existing license documents if available
    const loadProfileDocs = async () => {
      try {
        setLoading(true);
        const profile = await api.getSPProfile();
        const docs = (profile as any)?.professionalLicenseDocuments || [];
        if (Array.isArray(docs) && docs.length > 0) {
          if (docs[0]?.professionalDocsFront) {
            setFront1(docs[0].professionalDocsFront);
          }
          if (docs.length > 1 && docs[1]?.professionalDocsFront) {
            setFront2(docs[1].professionalDocsFront);
          }
          if (docs[0]?.expiryDate) {
            const rawExp = Number(docs[0].expiryDate);
            if (!isNaN(rawExp) && rawExp > 0) {
              const d = new Date(rawExp > 10000000000 ? rawExp : rawExp * 1000);
              setExpiryDate(d);
              setExpiryTimestamp(Math.floor(d.getTime() / 1000));
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const yyyy = d.getFullYear();
              setExpiryFormatted(`${mm}/${dd}/${yyyy}`);
            }
          }
        }
      } catch (err) {
        console.log("Profile docs load note:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileDocs();
  }, []);

  const pick = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setExpiryDate(selectedDate);
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      const yyyy = selectedDate.getFullYear();
      setExpiryFormatted(`${mm}/${dd}/${yyyy}`);
      setExpiryTimestamp(Math.floor(selectedDate.getTime() / 1000));
    }
  };

  const submit = async () => {
    // Validation matching iOS SrviceCertificatesViewController.swift
    if (customerType === 0 || customerType === 1) {
      if (!front1) {
        showAlert("Required", "Please add image first!");
        return;
      }
    } else {
      if (!front1 || !front2) {
        showAlert("Required", "Please add images first!");
        return;
      }
    }

    if (!expiryTimestamp || expiryTimestamp < 1) {
      showAlert("Required", "Please add expiry date");
      return;
    }

    try {
      setLoading(true);

      // Upload front image 1 (if local uri)
      const frontUrl1 = front1 && !front1.startsWith("http")
        ? await api.uploadImage(front1, UploadImageType.certificates)
        : front1 || "";

      // Upload front image 2 (if local uri and customerType == 2)
      let frontUrl2 = "";
      if (customerType === 2) {
        frontUrl2 = front2 && !front2.startsWith("http")
          ? await api.uploadImage(front2, UploadImageType.certificates)
          : front2 || "";
      }

      // Build serviceImages array matching iOS schema
      let serviceImages: any[] = [];
      if (customerType === 0) {
        serviceImages = [
          {
            professionalDocsType: 0,
            professionalDocsFront: frontUrl1,
            expiryDate: expiryTimestamp,
          },
        ];
      } else if (customerType === 1) {
        serviceImages = [
          {
            professionalDocsType: 1,
            professionalDocsFront: frontUrl1,
            expiryDate: expiryTimestamp,
          },
        ];
      } else {
        serviceImages = [
          {
            professionalDocsType: 0,
            professionalDocsFront: frontUrl1,
            expiryDate: expiryTimestamp,
          },
          {
            professionalDocsType: 1,
            professionalDocsFront: frontUrl2,
            expiryDate: expiryTimestamp,
          },
        ];
      }

      // Non-blocking sync for selectServiceFor matching iOS line 341
      try {
        await api.selectServiceFor({ serviceFor: customerType, userType: 2 });
      } catch (e) {
        console.log("selectServiceFor sync:", e);
      }

      // Main certificates update API call matching iOS line 349
      await api.updateServicePreference({
        serviceImages,
        serviceFor: customerType,
        professionalLicenseDocuments: serviceImages.map((img) => ({
          ...img,
          professionalDocsTitle: "Professional License",
          professionalDocsBack: "",
        })),
      });

      if (!isFromSettings) {
        await updateUser({ signUpStepCompleted: Math.max(user.signUpStepCompleted, 4) });
      }

      if (isFromSettings) {
        showAlert(
          "Success",
          "Service certificate has been updated successfully."
        );
        if (navigationRef.isReady()) {
          navigationRef.navigate("Main", { screen: "Settings" } as any);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          (navigation as any).navigate("Settings");
        }
      } else {
        navigation.navigate("IdentityDocuments");
      }
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to update professional license.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isFromSettings) {
      if (navigationRef.isReady()) {
        navigationRef.navigate("Main", { screen: "Settings" } as any);
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).navigate("Settings");
      }
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Services");
    }
  };

  const label1 =
    customerType === 1
      ? "Please upload a front side clear image of your Professional License for disabled customers"
      : "Please upload a front side clear image of your Professional License";

  const label2 =
    "Please upload a front side clear image of your Professional License for disabled customers";

  return (
    <View style={styles.container}>
      <Header title="Professional License" onBackPress={handleBack} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Professional License</Text>
          <Text style={styles.headerSubtitle}>
            Upload clear photos of your valid license and provide its expiration date.
          </Text>
        </View>

        {/* 1. First License Upload Card */}
        <View style={styles.card}>
          <Text style={styles.uploadCardTitle}>{label1}</Text>
          <TouchableOpacity
            onPress={() => pick(setFront1)}
            style={[styles.uploadBox, front1 && styles.uploadBoxFilled]}
            activeOpacity={0.8}
          >
            {front1 ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: front1 }} style={styles.imagePreview} />
                <View style={styles.changeBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                  <Text style={styles.changeBadgeText}>Change Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={28}
                    color={Colors.ButtonPrimaryColor}
                  />
                </View>
                <Text style={styles.uploadMainText}>Tap to Upload License Photo</Text>
                <Text style={styles.uploadSubText}>PNG, JPG up to 10MB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Second License Upload Card (Shown when customerType == 2 / Both) */}
        {customerType === 2 && (
          <View style={styles.card}>
            <Text style={styles.uploadCardTitle}>{label2}</Text>
            <TouchableOpacity
              onPress={() => pick(setFront2)}
              style={[styles.uploadBox, front2 && styles.uploadBoxFilled]}
              activeOpacity={0.8}
            >
              {front2 ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: front2 }} style={styles.imagePreview} />
                  <View style={styles.changeBadge}>
                    <Ionicons name="camera" size={14} color="#FFFFFF" />
                    <Text style={styles.changeBadgeText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.uploadIconCircle}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={28}
                      color={Colors.ButtonPrimaryColor}
                    />
                  </View>
                  <Text style={styles.uploadMainText}>
                    Tap to Upload License Photo
                  </Text>
                  <Text style={styles.uploadSubText}>PNG, JPG up to 10MB</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Expiration Date Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>License Expiry Date</Text>
          <TouchableOpacity
            style={styles.datePickerTrigger}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.datePickerText,
                !expiryFormatted && { color: Colors.PlaceholderInactive },
              ]}
            >
              {expiryFormatted || "Select Expiry Date (MM/DD/YYYY)"}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.ButtonPrimaryColor}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerBox}>
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.dateConfirmBtn}
                  onPress={() => {
                    const mm = String(expiryDate.getMonth() + 1).padStart(2, "0");
                    const dd = String(expiryDate.getDate()).padStart(2, "0");
                    const yyyy = expiryDate.getFullYear();
                    setExpiryFormatted(`${mm}/${dd}/${yyyy}`);
                    setExpiryTimestamp(Math.floor(expiryDate.getTime() / 1000));
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.dateConfirmBtnText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Main Bottom Submit Button */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isFromSettings ? "Update License Details" : t("common:next")}
          onPress={submit}
        />
      </View>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.base,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  datePickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    height: 50,
  },
  datePickerText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  datePickerBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateConfirmBtn: {
    alignSelf: "flex-end",
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  dateConfirmBtnText: {
    color: "#FFFFFF",
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.xs,
  },
  uploadCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  uploadBox: {
    height: 180,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadMainText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
    textAlign: "center",
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
});

