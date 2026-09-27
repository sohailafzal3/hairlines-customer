import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { useUser } from "../../../context/UserContext";
import { MyProfile as MyProfileType } from "../../../types";
import * as ImagePicker from "expo-image-picker";
import { UploadImageType } from "../../../constants";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "Profile">;

export function MyProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyProfileType | null>(null);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState("");

  useEffect(() => {
    api
      .getSPProfile()
      .then((res) => {
        setProfile(res);
        setFirstName(res.firstName || user.firstName);
        setLastName(res.lastName || user.lastName);
        setEmail(res.email || user.email);
        setBio(res.bio || "");
      })
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      try {
        setLoading(true);
        const url = await api.uploadImage(result.assets[0].uri, UploadImageType.profileImage);
        await updateUser({ profileImage: url });
      } catch (e: any) {
        showAlert("Error", e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const save = async () => {
    try {
      setLoading(true);
      await api.updateBasicInfo({ firstName, lastName, email, about: bio });
      await updateUser({ firstName, lastName, email });
      showAlert("Success", "Profile updated");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      await api.deleteAccount();
      await api.clearSession();
      await updateUser({ isLoggedIn: false });
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const initial = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : "P";

  return (
    <View style={styles.container}>
      <Header title={t("drawer:profile")} onMenuPress={() => navigation.openDrawer()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} activeOpacity={0.8}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholder]}>
                <Text style={styles.initial}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.change}>Tap to Change Photo</Text>
        </View>

        {/* Info Card */}
        <View style={styles.formCard}>
          <Input label="First Name" value={firstName} onChangeText={setFirstName} />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Input
            label="Professional Bio"
            multiline
            numberOfLines={3}
            value={bio}
            onChangeText={setBio}
          />
        </View>

        {/* Buttons */}
        <Button title="Save Changes" onPress={save} />
        <View style={{ height: 12 }} />
        <Button
          title="Delete Account"
          variant="danger"
          onPress={deleteAccount}
        />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  avatarSection: { alignItems: "center", marginVertical: Spacing.lg },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.ButtonPrimaryColor,
  },
  placeholder: {
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 36, fontWeight: FontWeights.bold, color: "#FFFFFF" },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  change: {
    color: Colors.ButtonPrimaryColor,
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    marginBottom: Spacing.xl,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});

