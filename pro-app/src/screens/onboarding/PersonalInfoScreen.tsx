import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { Gender, UploadImageType } from "../../constants";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { Spacing, BorderRadius } from "../../theme/spacing";

import { useUser } from "../../context/UserContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "PersonalInfo">;

export function PersonalInfoScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { user, updateUser, clearUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.male);
  const [dob, setDob] = useState("");
  const [dobDate, setDobDate] = useState<Date>(new Date(1998, 0, 1));
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const handleBack = async () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      try {
        await api.logOut();
      } catch (e) {}
      await api.clearSession();
      await clearUser();
    }
  };
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [referralCode, setReferralCode] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [termsDescription, setTermsDescription] = useState<string>("");
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  useEffect(() => {
    api
      .getTermsConditions()
      .then((res) => {
        if (res?.termAndConditionDescription) {
          setTermsDescription(res.termAndConditionDescription);
        }
      })
      .catch((e) => console.log("Failed to fetch terms:", e.message));
  }, []);

  useEffect(() => {
    const data = route.params?.addressData;
    if (data) {
      if (data.address) setAddress(data.address);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
      if (data.postalCode) setPostalCode(data.postalCode);
      if (data.latitude) setLatitude(data.latitude);
      if (data.longitude) setLongitude(data.longitude);
    }

    const preserved = route.params?.preservedFormData;
    if (preserved) {
      if (preserved.firstName) setFirstName(preserved.firstName);
      if (preserved.lastName) setLastName(preserved.lastName);
      if (preserved.email) setEmail(preserved.email);
      if (preserved.password) setPassword(preserved.password);
      if (preserved.confirmPassword) setConfirmPassword(preserved.confirmPassword);
      if (preserved.gender) setGender(preserved.gender);
      if (preserved.dob) setDob(preserved.dob);
      if (preserved.dobDate) setDobDate(new Date(preserved.dobDate));
      if (preserved.referralCode) setReferralCode(preserved.referralCode);
      if (preserved.isTermsAccepted !== undefined) setIsTermsAccepted(preserved.isTermsAccepted);
      if (preserved.photo) setPhoto(preserved.photo);
    }
  }, [route.params?.addressData, route.params?.preservedFormData]);

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission Denied", "Location permission is required to detect your location.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (rev && rev.length > 0) {
        const top = rev[0];
        const parts = [
          top.name || top.streetNumber,
          top.street,
          top.city || top.subregion,
          top.region,
          top.postalCode,
        ].filter(Boolean);
        setAddress(parts.join(", ") || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        if (top.city || top.subregion) setCity(top.city || top.subregion || "");
        if (top.region) setState(top.region);
        if (top.postalCode) setPostalCode(top.postalCode);
      }
    } catch (e: any) {
      showAlert("Location Error", e.message || "Could not retrieve current location.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || password !== confirmPassword) {
      showAlert(t("validation:required"));
      return;
    }

    if (!isTermsAccepted) {
      showAlert(
        "Terms & Conditions Required",
        "Please read and agree to the Terms & Conditions before continuing."
      );
      return;
    }

    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (!postalCode.trim() || !usZipRegex.test(postalCode.trim())) {
      showAlert(
        "Invalid Postal Code",
        "Please provide a valid 5-digit US postal code (e.g. 33825, 10001, or 90210)."
      );
      return;
    }

    try {
      setLoading(true);
      let profileImage = "";
      if (photo) {
        profileImage = await api.uploadImage(photo, UploadImageType.profileImage);
      }

      let finalLat = latitude;
      let finalLng = longitude;
      if (typeof finalLat !== "number" || typeof finalLng !== "number") {
        try {
          const fullQuery = [address, city, state, postalCode.trim()].filter(Boolean).join(", ");
          const geocoded = await Location.geocodeAsync(fullQuery);
          if (geocoded && geocoded.length > 0) {
            finalLat = geocoded[0].latitude;
            finalLng = geocoded[0].longitude;
          }
        } catch (err) {
          console.warn("Geocoding fallback warning:", err);
        }
      }

      // Default to Florida coordinates if geocoding was unavailable
      if (typeof finalLat !== "number") finalLat = 27.5959;
      let formattedDob = dob;
      if (dob) {
        const clean = dob.replace(/\D/g, "");
        if (clean.length === 8) {
          formattedDob = clean;
        } else {
          const d = new Date(dob);
          if (!isNaN(d.getTime())) {
            const yyyy = String(d.getFullYear());
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            formattedDob = `${yyyy}${mm}${dd}`;
          }
        }
      }

      await api.addBasicInfo({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        gender,
        dob: formattedDob,
        address,
        city,
        state,
        postalCode: postalCode.trim(),
        latitude: finalLat,
        longitude: finalLng,
        referralCode: referralCode.trim(),
        profileImage,
        profileImageUrl: profileImage,
        countryCode: user.countryCode || user.phoneCode || "+1",
        phoneNumber: user.phoneNumber || "",
        userType: 2,
      });

      await updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        gender,
        dob: formattedDob,
        permanentAddress: address,
        city,
        state,
        postalCode: postalCode.trim(),
        lat: finalLat,
        long: finalLng,
        referralCode: referralCode.trim(),
        profileImage: profileImage || user.profileImage,
        signUpStepCompleted: Math.max(user.signUpStepCompleted, 1),
      });

      navigation.navigate("ServicesFor");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LoadingOverlay visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar - Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
            </TouchableOpacity>
          </View>

          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Help us personalize your partner profile & services
            </Text>
          </View>

          {/* Avatar Upload Container */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.85}
              style={styles.avatarWrapper}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={styles.profileImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color="#94A3B8" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Upload Profile Photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Side-by-Side First & Last Name */}
            <View style={styles.rowFields}>
              <Input
                label="First Name"
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                containerStyle={styles.flexHalf}
              />
              <Input
                label="Last Name"
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                containerStyle={styles.flexHalf}
              />
            </View>

            <Input
              label="Email Address"
              placeholder="partner@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Gender Selection Segment */}
            <Text style={styles.genderLabel}>Gender</Text>
            <View style={styles.genderSegmentRow}>
              {[
                { key: Gender.male, label: "Male", icon: "male" },
                { key: Gender.female, label: "Female", icon: "female" },
              ].map((item) => {
                const isActive = gender === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.genderCard, isActive && styles.genderCardActive]}
                    onPress={() => setGender(item.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={isActive ? Colors.ButtonPrimaryColor : "#64748B"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.genderCardText,
                        isActive && styles.genderCardTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date of Birth Picker Field */}
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.datePickerTrigger}
              onPress={() => setShowDobPicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.datePickerText,
                  !dob && { color: Colors.PlaceholderInactive },
                ]}
              >
                {dob || "Select Date of Birth (e.g. 19961212)"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.ButtonPrimaryColor}
              />
            </TouchableOpacity>

            {showDobPicker && (
              <View style={styles.datePickerBox}>
                <DateTimePicker
                  value={dobDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  maximumDate={new Date()}
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (Platform.OS !== "ios") {
                      setShowDobPicker(false);
                    }
                    if (selectedDate) {
                      setDobDate(selectedDate);
                      const yyyy = selectedDate.getFullYear();
                      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const dd = String(selectedDate.getDate()).padStart(2, "0");
                      setDob(`${yyyy}${mm}${dd}`);
                    }
                  }}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.dateConfirmBtn}
                    onPress={() => {
                      const yyyy = dobDate.getFullYear();
                      const mm = String(dobDate.getMonth() + 1).padStart(2, "0");
                      const dd = String(dobDate.getDate()).padStart(2, "0");
                      setDob(`${yyyy}${mm}${dd}`);
                      setShowDobPicker(false);
                    }}
                  >
                    <Text style={styles.dateConfirmBtnText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Input
              label="Password"
              placeholder="Create password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* Address with Tap to Set Location */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("SetLocation", {
                  currentFormData: {
                    firstName,
                    lastName,
                    email,
                    password,
                    confirmPassword,
                    gender,
                    dob,
                    dobDate: dobDate?.toISOString(),
                    referralCode,
                    isTermsAccepted,
                    photo,
                  },
                })
              }
              activeOpacity={0.8}
            >
              <Input
                label="Service / Residence Address"
                value={address}
                editable={false}
                pointerEvents="none"
                placeholder="Tap to search or set location"
              />
            </TouchableOpacity>

            <View style={styles.rowFields}>
              <Input
                label="City"
                placeholder="City"
                value={city}
                onChangeText={setCity}
                containerStyle={styles.flexHalf}
              />
              <Input
                label="State"
                placeholder="State"
                value={state}
                onChangeText={setState}
                containerStyle={styles.flexHalf}
              />
            </View>

            <View style={styles.rowFields}>
              <Input
                label="US Postal Code"
                placeholder="e.g. 33825"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="numeric"
                maxLength={10}
                containerStyle={styles.flexHalf}
              />
              <Input
                label="Referral Code (Optional)"
                placeholder="Referral Code"
                value={referralCode}
                onChangeText={setReferralCode}
                containerStyle={styles.flexHalf}
              />
            </View>

            {/* Agreement Checkbox & Text */}
            <View style={styles.agreementRow}>
              <TouchableOpacity
                onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                activeOpacity={0.8}
                style={[
                  styles.checkbox,
                  isTermsAccepted && styles.checkboxActive,
                ]}
              >
                {isTermsAccepted && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <View style={styles.agreementTextWrapper}>
                <Text style={styles.agreementText}>
                  I've read & agree with{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setTermsModalVisible(true)}
                  >
                    Terms & Conditions.
                  </Text>
                </Text>
              </View>
            </View>

            <Button
              title="Continue"
              onPress={submit}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity
              onPress={() => setTermsModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.TitleColor} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.modalBodyText}>
              {termsDescription
                ? termsDescription.replace(/<[^>]+>/g, "").trim()
                : "Welcome to Hairlines Pro. By registering and offering services through our platform, you agree to provide professional, safe, and quality salon/barbering services in compliance with all local regulations, maintain valid licensing and certifications, adhere to transparent appointment pricing and cancellation guidelines, and respect client confidentiality and booking agreements. All payouts are processed according to our stated fee structure."}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button
              title="I Understand & Accept"
              onPress={() => {
                setIsTermsAccepted(true);
                setTermsModalVisible(false);
              }}
              style={styles.modalAcceptBtn}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing["3xl"],
  },
  topBar: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.bold,
    color: "#0F172A",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: "#64748B",
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: Colors.ButtonPrimaryColor,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: Colors.ButtonPrimaryColor,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#64748B",
    marginTop: 6,
  },
  formContainer: {
    width: "100%",
  },
  rowFields: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flexHalf: {
    flex: 1,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: Spacing.base,
  },
  datePickerText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  datePickerBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
    borderWidth: 1.5,
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
  genderLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#334155",
    marginBottom: Spacing.xs,
  },
  genderSegmentRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  genderCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#EEF4FF",
  },
  genderCardText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#64748B",
  },
  genderCardTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  checkboxActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  agreementTextWrapper: {
    flex: 1,
  },
  agreementText: {
    fontSize: FontSizes.sm,
    color: "#334155",
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
    textDecorationLine: "underline",
  },
  submitButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.xs,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  modalBodyText: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
    color: "#334155",
  },
  modalFooter: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  modalAcceptBtn: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 50,
  },
  stackedLocationOptions: {
    marginTop: 6,
    marginBottom: Spacing.md,
    gap: 8,
  },
  stackedLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stackedLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stackedLocationTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  stackedLocationSub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
  },
});
