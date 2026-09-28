import React, { useState } from "react";
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
import { Input } from "../../components/Input";
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

type Props = NativeStackScreenProps<OnboardingStackParamList, "Certificates">;

export function CertificatesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);

  const isFromSettings =
    (route.params as any)?.isFromSettings || user.isSignUpCompleted;

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
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      setExpiry(`${yyyy}-${mm}-${dd}`);
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      showAlert("Required", "Please enter the license / certification title.");
      return;
    }
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
            professionalDocsTitle: title.trim(),
            professionalDocsFront: frontUrl,
            professionalDocsBack: backUrl,
            expiryDate: expiry || undefined,
          },
        ],
      });

      if (isFromSettings) {
        showAlert("Success", "Your professional license details have been updated.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("ServicesFor");
        }
      } else {
        navigation.navigate("IdentityDocuments");
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
      navigation.navigate("ServicesFor");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Professional Licenses" onBackPress={handleBack} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>License & Certifications</Text>
          <Text style={styles.headerSubtitle}>
            Upload your professional licensing or trade certificates to build credibility with clients.
          </Text>
        </View>

        <View style={styles.card}>
          <Input
            label="License / Certificate Title"
            placeholder="e.g. Master Barber License, Cosmetology"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>License Expiry Date</Text>
          <TouchableOpacity
            style={styles.datePickerTrigger}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.datePickerText,
                !expiry && { color: Colors.PlaceholderInactive },
              ]}
            >
              {expiry || "Select Expiry Date (YYYY-MM-DD)"}
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
                    const yyyy = expiryDate.getFullYear();
                    const mm = String(expiryDate.getMonth() + 1).padStart(2, "0");
                    const dd = String(expiryDate.getDate()).padStart(2, "0");
                    setExpiry(`${yyyy}-${mm}-${dd}`);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.dateConfirmBtnText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text style={styles.sectionHeading}>DOCUMENT PHOTOS</Text>

        <View style={styles.card}>
          <Text style={styles.uploadCardTitle}>Front of License / Certificate</Text>
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
                    name="cloud-upload-outline"
                    size={26}
                    color={Colors.ButtonPrimaryColor}
                  />
                </View>
                <Text style={styles.uploadMainText}>Tap to Upload Front Photo</Text>
                <Text style={styles.uploadSubText}>PNG, JPG up to 10MB</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.uploadCardTitle, { marginTop: Spacing.lg }]}>
            Back of License (Optional)
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
                    name="cloud-upload-outline"
                    size={26}
                    color={Colors.ButtonPrimaryColor}
                  />
                </View>
                <Text style={styles.uploadMainText}>Tap to Upload Back Photo</Text>
                <Text style={styles.uploadSubText}>Optional if single-sided</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Main Save / Update Button Pinned at Bottom */}
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
  sectionHeading: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
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
    marginBottom: Spacing.md,
  },
  datePickerText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  datePickerBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
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
});

