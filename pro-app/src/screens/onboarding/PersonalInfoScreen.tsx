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
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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

type Props = NativeStackScreenProps<OnboardingStackParamList, "PersonalInfo">;

export function PersonalInfoScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<Gender>(Gender.male);
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [referralCode, setReferralCode] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    const data = route.params?.addressData;
    if (data) {
      setAddress(data.address || "");
      setCity(data.city || "");
      setState(data.state || "");
      setPostalCode(data.postalCode || "");
      setLatitude(data.latitude);
      setLongitude(data.longitude);
    }
  }, [route.params?.addressData]);

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
    if (!firstName || !lastName || !email || !password || password !== confirmPassword) {
      showAlert(t("validation:required"));
      return;
    }
    try {
      setLoading(true);
      let profileImage = "";
      if (photo) {
        profileImage = await api.uploadImage(photo, UploadImageType.profileImage);
      }
      await api.addBasicInfo({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        gender,
        dob,
        address,
        city,
        state,
        postalCode,
        latitude,
        longitude,
        referralCode,
        profileImage,
        userType: 2,
      });
      navigation.navigate("Services");
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
              onPress={() => navigation.goBack()}
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

            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={setDob}
            />

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
              onPress={() => navigation.navigate("SetLocation")}
              activeOpacity={0.8}
            >
              <Input
                label="Service / Residence Address"
                value={address}
                editable={false}
                pointerEvents="none"
                placeholder="Tap to set location"
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
                label="Postal Code"
                placeholder="Postal Code"
                value={postalCode}
                onChangeText={setPostalCode}
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

            <Button
              title="Continue"
              onPress={submit}
              style={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  submitButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.base,
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
});
