import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
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

  return (
    <View style={styles.container}>
      <Header title={t("drawer:profile")} onMenuPress={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Text style={styles.initial}>
                {user.name ? user.name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
          )}
          <Text style={styles.change}>Change Photo</Text>
        </TouchableOpacity>
        <Input label="First Name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last Name" value={lastName} onChangeText={setLastName} />
        <Input label="Email" value={email} onChangeText={setEmail} />
        <Input label="Bio" multiline value={bio} onChangeText={setBio} />
        <Button title="Save" onPress={save} />
        <View style={{ height: 12 }} />
        <Button title="Change Password" variant="secondary" onPress={() => {}} />
        <View style={{ height: 12 }} />
        <Button title="Delete Account" variant="danger" onPress={deleteAccount} />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 32 },
  avatarWrap: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholder: {
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 36, fontWeight: "700", color: "#555" },
  change: { color: "#2E7D32", marginTop: 8, fontWeight: "500" },
});
