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
import { Avatar } from "../../components/Avatar";
import * as ImagePicker from "expo-image-picker";
import { Gender, UploadImageType } from "../../constants";

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
      quality: 0.7,
    });
    if (!result.canceled) {
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
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("onboarding:personalInfo")}</Text>
      <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
        <Avatar uri={photo ?? undefined} name={firstName || lastName} size={80} />
        <Text style={styles.changePhoto}>Change photo</Text>
      </TouchableOpacity>
      <Input label="First Name" value={firstName} onChangeText={setFirstName} />
      <Input label="Last Name" value={lastName} onChangeText={setLastName} />
      <Input label="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Input label="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <Input label="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
      <TouchableOpacity onPress={() => navigation.navigate("SetLocation")}>
        <Input
          label="Address"
          value={address}
          editable={false}
          pointerEvents="none"
          placeholder="Tap to set location"
        />
      </TouchableOpacity>
      <Input label="City" value={city} onChangeText={setCity} />
      <Input label="State" value={state} onChangeText={setState} />
      <Input label="Postal Code" value={postalCode} onChangeText={setPostalCode} />
      <Input label="Referral Code" value={referralCode} onChangeText={setReferralCode} />
      <Button title={t("common:next")} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#333" },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  changePhoto: { color: "#2E7D32", marginTop: 8, fontWeight: "500" },
});
