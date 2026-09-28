import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
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
import { UploadImageType, GOOGLE_API_KEY } from "../../../constants";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "Profile">;

interface Prediction {
  place_id: string;
  description: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  postalCode?: string;
}

export function MyProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "reviews">("profile");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MyProfileType | null>(null);

  // Profile Form States
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [gender, setGender] = useState<string>("Male");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [address, setAddress] = useState(user.permanentAddress || "");
  const [city, setCity] = useState(user.city || "");
  const [state, setState] = useState(user.state || "");
  const [postalCode, setPostalCode] = useState(user.postalCode || "");
  const [bio, setBio] = useState("");
  const [latitude, setLatitude] = useState(user.lat || 0);
  const [longitude, setLongitude] = useState(user.long || 0);

  const [reviews, setReviews] = useState<any[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // DOB Picker Modal State
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [tempYear, setTempYear] = useState(1995);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(15);

  // Address Selection Modal State
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressPredictions, setAddressPredictions] = useState<Prediction[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const formatDOBString = (raw: any): string => {
    if (!raw || raw === 0 || raw === "0" || raw === "0.0" || raw === 0.0) return "";
    const num = Number(raw);
    if (!isNaN(num) && num > 0 && (!String(raw).includes("/") && !String(raw).includes("-"))) {
      const ms = num > 1e11 ? num : num * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
      }
    }
    if (typeof raw === "string") {
      if (raw.includes("T")) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const yyyy = d.getFullYear();
          return `${mm}/${dd}/${yyyy}`;
        }
      }
      return raw;
    }
    return "";
  };

  const getDobTimestamp = (dobString: string): number => {
    if (!dobString || dobString.trim() === "") return 0;
    const parts = dobString.split("/");
    if (parts.length === 3) {
      const mm = parseInt(parts[0], 10) - 1;
      const dd = parseInt(parts[1], 10);
      const yyyy = parseInt(parts[2], 10);
      const d = new Date(yyyy, mm, dd);
      if (!isNaN(d.getTime())) {
        return Math.floor(d.getTime() / 1000); // Unix timestamp in seconds for backend
      }
    }
    const d = new Date(dobString);
    if (!isNaN(d.getTime())) {
      return Math.floor(d.getTime() / 1000);
    }
    return 0;
  };

  const openDobModal = () => {
    if (dateOfBirth) {
      const parts = dateOfBirth.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) setTempMonth(m);
        if (!isNaN(d) && d >= 1 && d <= 31) setTempDay(d);
        if (!isNaN(y) && y >= 1920) setTempYear(y);
      }
    }
    setDobModalVisible(true);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [res, ratingsRes] = await Promise.all([
        api.getSPProfile().catch(() => null),
        api.getSPRatings().catch(() => ({ ratings: [] })),
      ]);

      if (res) {
        setProfile(res);
        const fName = res.firstName || user.firstName || "";
        const lName = res.lastName || user.lastName || "";
        const em = res.email || user.email || "";
        const ph = res.phoneNumber || user.phoneNumber || "";
        const gen = res.gender ? res.gender.charAt(0).toUpperCase() + res.gender.slice(1).toLowerCase() : "Male";
        const dobStr = formatDOBString(res.dob || (res as any).dateOfBirth || (user as any).dob);
        const addr = res.primaryAddress || (res as any).userPrimaryAddress || user.permanentAddress || "";
        const ct = res.city || (res as any).userCity || user.city || "";
        const st = res.state || (res as any).userState || user.state || "";
        const pc = res.postalCode || user.postalCode || "";
        const b = res.about || (res as any).bio || "";
        const lat = res.latitude || (res as any).userLat || user.lat || 0;
        const lng = res.longitude || (res as any).userLong || user.long || 0;

        setFirstName(fName);
        setLastName(lName);
        setEmail(em);
        setPhoneNumber(ph);
        setGender(gen);
        setDateOfBirth(dobStr);
        setAddress(addr);
        setCity(ct);
        setState(st);
        setPostalCode(pc);
        setBio(b);
        setLatitude(lat);
        setLongitude(lng);

        if (dobStr) {
          const parts = dobStr.split("/");
          if (parts.length === 3) {
            setTempMonth(parseInt(parts[0], 10) || 1);
            setTempDay(parseInt(parts[1], 10) || 15);
            setTempYear(parseInt(parts[2], 10) || 1995);
          }
        }

        // Keep global user context in sync
        updateUser({
          firstName: fName,
          lastName: lName,
          name: `${fName} ${lName}`.trim(),
          email: em,
          phoneNumber: ph,
          gender: gen,
          dob: dobStr,
          permanentAddress: addr,
          city: ct,
          state: st,
          postalCode: pc,
          lat: lat,
          long: lng,
          profileImage: res.profileImage || user.profileImage,
        });
      } else {
        const dobStr = formatDOBString((user as any).dob);
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phoneNumber || "");
        setDateOfBirth(dobStr);
        setAddress(user.permanentAddress || "");
        setCity(user.city || "");
        setState(user.state || "");
        setPostalCode(user.postalCode || "");
        setLatitude(user.lat || 0);
        setLongitude(user.long || 0);
      }

      if (ratingsRes?.ratings) {
        setReviews(ratingsRes.ratings);
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
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
        const url = await api.uploadImage(
          result.assets[0].uri,
          UploadImageType.profileImage
        );
        await updateUser({ profileImage: url });
        showAlert("Success", "Profile image updated successfully");
      } catch (e: any) {
        showAlert("Error", e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApplyDOB = () => {
    const mm = String(tempMonth).padStart(2, "0");
    const dd = String(tempDay).padStart(2, "0");
    const yyyy = String(tempYear);
    setDateOfBirth(`${mm}/${dd}/${yyyy}`);
    setDobModalVisible(false);
  };

  // Google Places + OSM Nominatim + Native Autocomplete Search
  const searchAddress = async (text: string) => {
    setAddressQuery(text);
    if (!text.trim() || text.length < 2) {
      setAddressPredictions([]);
      return;
    }
    setSearchingAddress(true);
    try {
      let foundPredictions: Prediction[] = [];

      // 1. Try Google Places Autocomplete if key is available
      if (GOOGLE_API_KEY) {
        try {
          const url =
            `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
            `?input=${encodeURIComponent(text)}` +
            `&key=${GOOGLE_API_KEY}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === "OK" && json.predictions?.length > 0) {
            foundPredictions = json.predictions.map((p: any) => ({
              place_id: p.place_id,
              description: p.description,
            }));
          }
        } catch (err) {
          console.warn("Google places search error:", err);
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim if Google returns empty
      if (foundPredictions.length === 0) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&addressdetails=1&limit=6`;
          const res = await fetch(nomUrl, {
            headers: { "User-Agent": "HairlinesProApp/1.0" },
          });
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            foundPredictions = json.map((item: any) => {
              const addr = item.address || {};
              const cty =
                addr.city || addr.town || addr.village || addr.suburb || "";
              const st = addr.state || "";
              const pc = addr.postcode || "";
              return {
                place_id: `osm_${item.place_id}`,
                description: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                city: cty,
                state: st,
                postalCode: pc,
              };
            });
          }
        } catch (err) {
          console.warn("OSM search error:", err);
        }
      }

      // 3. Fallback to Native Expo Geocoding if still empty
      if (foundPredictions.length === 0) {
        try {
          const geoResults = await Location.geocodeAsync(text);
          if (geoResults && geoResults.length > 0) {
            const topGeo = geoResults[0];
            const rev = await Location.reverseGeocodeAsync({
              latitude: topGeo.latitude,
              longitude: topGeo.longitude,
            });
            const first = rev?.[0];
            const desc = first
              ? [
                  first.streetNumber,
                  first.street || first.name,
                  first.city || first.subregion,
                  first.region,
                  first.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")
              : text;

            foundPredictions = [
              {
                place_id: `geo_${topGeo.latitude}_${topGeo.longitude}`,
                description: desc || text,
                lat: topGeo.latitude,
                lng: topGeo.longitude,
                city: first?.city || first?.subregion || "",
                state: first?.region || "",
                postalCode: first?.postalCode || "",
              },
            ];
          }
        } catch (err) {
          console.warn("Native geocode search error:", err);
        }
      }

      setAddressPredictions(foundPredictions);
    } catch (e) {
      console.warn("Places search error:", e);
      setAddressPredictions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Select Place Prediction
  const selectPlacePrediction = async (prediction: Prediction) => {
    setSearchingAddress(true);
    try {
      if (prediction.lat !== undefined && prediction.lng !== undefined) {
        setAddress(prediction.description);
        if (prediction.city) setCity(prediction.city);
        if (prediction.state) setState(prediction.state);
        if (prediction.postalCode) setPostalCode(prediction.postalCode);
        setLatitude(prediction.lat);
        setLongitude(prediction.lng);

        setAddressModalVisible(false);
        setAddressQuery("");
        setAddressPredictions([]);
        return;
      }

      let lat = 0;
      let lng = 0;
      let extractedCity = "";
      let extractedState = "";
      let extractedPostalCode = "";
      let fullAddr = prediction.description;

      if (GOOGLE_API_KEY && prediction.place_id && !prediction.place_id.startsWith("osm_")) {
        try {
          const url =
            `https://maps.googleapis.com/maps/api/place/details/json` +
            `?place_id=${prediction.place_id}` +
            `&fields=address_components,formatted_address,geometry` +
            `&key=${GOOGLE_API_KEY}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === "OK" && json.result) {
            const place = json.result;
            const comps = place.address_components || [];
            comps.forEach((c: any) => {
              if (c.types.includes("locality")) extractedCity = c.long_name;
              if (c.types.includes("administrative_area_level_1"))
                extractedState = c.short_name || c.long_name;
              if (c.types.includes("postal_code"))
                extractedPostalCode = c.long_name;
            });
            fullAddr = place.formatted_address || prediction.description;
            lat = place.geometry?.location?.lat || 0;
            lng = place.geometry?.location?.lng || 0;
          }
        } catch (err) {
          console.warn("Google place details error:", err);
        }
      }

      if (!lat || !lng) {
        try {
          const geo = await Location.geocodeAsync(prediction.description);
          if (geo && geo.length > 0) {
            lat = geo[0].latitude;
            lng = geo[0].longitude;
            const rev = await Location.reverseGeocodeAsync({
              latitude: lat,
              longitude: lng,
            });
            if (rev && rev.length > 0) {
              const top = rev[0];
              if (!extractedCity)
                extractedCity = top.city || top.subregion || "";
              if (!extractedState) extractedState = top.region || "";
              if (!extractedPostalCode)
                extractedPostalCode = top.postalCode || "";
            }
          }
        } catch (err) {
          console.warn("Native geocode fallback error:", err);
        }
      }

      setAddress(fullAddr);
      if (extractedCity) setCity(extractedCity);
      if (extractedState) setState(extractedState);
      if (extractedPostalCode) setPostalCode(extractedPostalCode);
      if (lat) setLatitude(lat);
      if (lng) setLongitude(lng);

      setAddressModalVisible(false);
      setAddressQuery("");
      setAddressPredictions([]);
    } catch (e: any) {
      showAlert("Error", "Could not fetch place details. Please try again.");
    } finally {
      setSearchingAddress(false);
    }
  };

  // Use Current Location
  const handleUseCurrentLocation = async () => {
    try {
      setSearchingAddress(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Location permission is required to detect your location."
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      let resolved = false;

      // 1. Native Expo Reverse Geocoding (CLGeocoder on iOS, Android Geocoder)
      try {
        const rev = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (rev && rev.length > 0) {
          const item = rev[0];
          const parts = [
            item.name || item.streetNumber,
            item.street,
            item.city || item.subregion || item.district,
            item.region,
            item.postalCode,
            item.country,
          ].filter(Boolean);

          const fullAddr = parts.join(", ");
          if (fullAddr) {
            setAddress(fullAddr);
            if (item.city || item.subregion)
              setCity(item.city || item.subregion || "");
            if (item.region) setState(item.region);
            if (item.postalCode) setPostalCode(item.postalCode);
            setLatitude(lat);
            setLongitude(lng);
            setAddressModalVisible(false);
            resolved = true;
          }
        }
      } catch (err) {
        console.warn("Native reverse geocode error:", err);
      }

      if (resolved) return;

      // 2. Google Geocoding API
      if (GOOGLE_API_KEY) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
          const res = await fetch(geocodeUrl);
          const json = await res.json();

          if (json.status === "OK" && json.results?.length > 0) {
            const topResult = json.results[0];
            const comps = topResult.address_components || [];
            let extractedCity = "";
            let extractedState = "";
            let extractedPostalCode = "";

            comps.forEach((c: any) => {
              if (c.types.includes("locality")) extractedCity = c.long_name;
              if (c.types.includes("administrative_area_level_1"))
                extractedState = c.short_name || c.long_name;
              if (c.types.includes("postal_code"))
                extractedPostalCode = c.long_name;
            });

            setAddress(topResult.formatted_address);
            if (extractedCity) setCity(extractedCity);
            if (extractedState) setState(extractedState);
            if (extractedPostalCode) setPostalCode(extractedPostalCode);
            setLatitude(lat);
            setLongitude(lng);
            setAddressModalVisible(false);
            resolved = true;
          }
        } catch (err) {
          console.warn("Google reverse geocode error:", err);
        }
      }

      if (resolved) return;

      // 3. OpenStreetMap Nominatim Reverse Geocoding
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(nomUrl, {
          headers: { "User-Agent": "HairlinesProApp/1.0" },
        });
        const json = await res.json();
        if (json && json.display_name) {
          const addrObj = json.address || {};
          const extractedCity =
            addrObj.city ||
            addrObj.town ||
            addrObj.village ||
            addrObj.suburb ||
            "";
          const extractedState = addrObj.state || "";
          const extractedPostalCode = addrObj.postcode || "";

          setAddress(json.display_name);
          if (extractedCity) setCity(extractedCity);
          if (extractedState) setState(extractedState);
          if (extractedPostalCode) setPostalCode(extractedPostalCode);
          setLatitude(lat);
          setLongitude(lng);
          setAddressModalVisible(false);
          resolved = true;
        }
      } catch (err) {
        console.warn("Nominatim reverse geocode error:", err);
      }

      if (!resolved) {
        setAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setLatitude(lat);
        setLongitude(lng);
        setAddressModalVisible(false);
      }
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to get current location");
    } finally {
      setSearchingAddress(false);
    }
  };

  // Quick Preset Address (Home / Work)
  const handleQuickPreset = (presetType: "Home" | "Work") => {
    const defaultCity = city || "New York";
    const defaultState = state || "NY";
    const defaultPostal = postalCode || "10001";
    setAddress(`${presetType} Location, ${defaultCity}, ${defaultState}`);
    setAddressModalVisible(false);
  };

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showAlert("Required", "Please enter first and last name.");
      return;
    }
    if (!email.trim()) {
      showAlert("Required", "Please enter a valid email address.");
      return;
    }
    if (!address.trim()) {
      showAlert("Required", "Please enter your address.");
      return;
    }

    const dobUnix = getDobTimestamp(dateOfBirth);

    try {
      setLoading(true);
      await api.updateBasicInfo({
        firstName,
        lastName,
        email: email.toLowerCase(),
        gender,
        dob: dobUnix,
        dateOfBirth: dobUnix,
        about: bio,
        permanentAddress: address,
        address,
        city,
        state,
        postalCode,
        latitude,
        longitude,
      });

      await updateUser({
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email: email.toLowerCase(),
        gender,
        dob: dateOfBirth,
        permanentAddress: address,
        city,
        state,
        postalCode,
        lat: latitude,
        long: longitude,
      });

      showAlert("Success", "Profile updated successfully!");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showAlert("Required", "Please enter current and new password");
      return;
    }
    try {
      setLoading(true);
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordSection(false);
      showAlert("Success", "Password changed successfully");
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
    : firstName
    ? firstName.charAt(0).toUpperCase()
    : "P";

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:profile")}
        onMenuPress={() => navigation.openDrawer()}
      />

      {/* Profile Segment Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "profile" && styles.tabBtnActive]}
          onPress={() => setActiveTab("profile")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "profile" && styles.tabTextActive,
            ]}
          >
            Profile Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "reviews" && styles.tabBtnActive]}
          onPress={() => setActiveTab("reviews")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reviews" && styles.tabTextActive,
            ]}
          >
            Ratings & Reviews ({reviews.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "profile" ? (
          <>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.avatarWrap}
                activeOpacity={0.8}
              >
                {user.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={styles.avatar}
                  />
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
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Phone Number"
                value={phoneNumber}
                editable={false}
              />

              {/* Gender Selection */}
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {["Male", "Female"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={gender === g ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={gender === g ? Colors.ButtonPrimaryColor : "#94A3B8"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date of Birth Picker Field */}
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.datePickerTrigger}
                onPress={openDobModal}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.datePickerTriggerText,
                    !dateOfBirth && { color: Colors.PlaceholderInactive },
                  ]}
                >
                  {dateOfBirth || "Select Date of Birth (MM/DD/YYYY)"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Colors.ButtonPrimaryColor}
                />
              </TouchableOpacity>

              {/* Address Picker Field */}
              <Text style={styles.inputLabel}>Address</Text>
              <TouchableOpacity
                style={styles.addressTrigger}
                onPress={() => setAddressModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={Colors.ButtonPrimaryColor}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.addressTriggerText,
                    !address && { color: Colors.PlaceholderInactive },
                  ]}
                  numberOfLines={2}
                >
                  {address || "Tap to search address, Home, or Current Location"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.DescriptionTextDark}
                />
              </TouchableOpacity>

              <View style={styles.rowInputs}>
                <Input
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <Input
                  label="State"
                  value={state}
                  onChangeText={setState}
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <Input
                label="Postal Code"
                value={postalCode}
                onChangeText={setPostalCode}
              />
              <Input
                label="Professional Bio"
                multiline
                numberOfLines={3}
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {/* Password Section */}
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPasswordSection((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.ButtonPrimaryColor}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.passwordToggleText}>
                {showPasswordSection ? "Cancel Password Change" : "Change Password"}
              </Text>
              <Ionicons
                name={showPasswordSection ? "chevron-up" : "chevron-down"}
                size={16}
                color={Colors.ButtonPrimaryColor}
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={styles.formCard}>
                <Input
                  label="Current Password"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <Input
                  label="New Password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Button title="Update Password" onPress={handleChangePassword} />
              </View>
            )}

            {/* Buttons */}
            <Button title="Save Profile Changes" onPress={save} />
            <View style={{ height: 12 }} />
            <Button
              title="Delete Account"
              variant="danger"
              onPress={deleteAccount}
            />
          </>
        ) : (
          /* Ratings & Reviews List */
          <View style={styles.reviewsContainer}>
            <View style={styles.ratingSummaryCard}>
              <Text style={styles.ratingBig}>
                {(profile?.avgRating ?? user.avgRating ?? 0).toFixed(1)}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const ratingVal = profile?.avgRating ?? user.avgRating ?? 0;
                  return (
                    <Text
                      key={s}
                      style={[
                        styles.starIcon,
                        s <= Math.round(ratingVal)
                          ? { color: "#F59E0B" }
                          : { color: "#CBD5E1" },
                      ]}
                    >
                      ★
                    </Text>
                  );
                })}
              </View>
              <Text style={styles.ratingCount}>
                Based on {reviews.length} customer review{reviews.length === 1 ? "" : "s"}
              </Text>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Ionicons name="star-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyReviewsText}>
                  No reviews received yet.
                </Text>
              </View>
            ) : (
              reviews.map((rev, idx) => (
                <View key={rev.id || idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{
                        uri:
                          rev.profileImage ||
                          "https://hairlines-lives2.s3.amazonaws.com/default-avatar.png",
                      }}
                      style={styles.reviewerAvatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.reviewerName}>
                        {rev.name || "Customer"}
                      </Text>
                      <View style={styles.starMiniRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text
                            key={star}
                            style={[
                              styles.starMini,
                              star <= (rev.avgRating || 5) &&
                                styles.starMiniActive,
                            ]}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                  {!!rev.review && (
                    <Text style={styles.reviewText}>{rev.review}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Date of Birth Picker Modal */}
      <Modal
        visible={dobModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDobModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dobModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity
                onPress={() => setDobModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={Colors.TitleColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.dobPickersRow}>
              {/* Month Selector */}
              <View style={styles.dobColumn}>
                <Text style={styles.dobColumnLabel}>Month</Text>
                <View style={styles.selectorBox}>
                  <TouchableOpacity
                    onPress={() => setTempMonth((m) => (m > 1 ? m - 1 : 12))}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.TitleColor} />
                  </TouchableOpacity>
                  <Text style={styles.selectorVal}>
                    {new Date(2000, tempMonth - 1, 1).toLocaleString("default", {
                      month: "short",
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTempMonth((m) => (m < 12 ? m + 1 : 1))}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.TitleColor} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day Selector */}
              <View style={styles.dobColumn}>
                <Text style={styles.dobColumnLabel}>Day</Text>
                <View style={styles.selectorBox}>
                  <TouchableOpacity
                    onPress={() => setTempDay((d) => (d > 1 ? d - 1 : 31))}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.TitleColor} />
                  </TouchableOpacity>
                  <Text style={styles.selectorVal}>{tempDay}</Text>
                  <TouchableOpacity
                    onPress={() => setTempDay((d) => (d < 31 ? d + 1 : 1))}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.TitleColor} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Year Selector */}
              <View style={styles.dobColumn}>
                <Text style={styles.dobColumnLabel}>Year</Text>
                <View style={styles.selectorBox}>
                  <TouchableOpacity
                    onPress={() =>
                      setTempYear((y) =>
                        y < new Date().getFullYear() - 18 ? y + 1 : y
                      )
                    }
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-up" size={20} color={Colors.TitleColor} />
                  </TouchableOpacity>
                  <Text style={styles.selectorVal}>{tempYear}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setTempYear((y) => (y > 1940 ? y - 1 : y))
                    }
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-down" size={20} color={Colors.TitleColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button title="Apply Date" onPress={handleApplyDOB} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <SafeAreaView style={styles.addressModalContainer}>
          <View style={styles.addressModalHeader}>
            <TouchableOpacity
              onPress={() => setAddressModalVisible(false)}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.TitleColor} />
            </TouchableOpacity>
            <Text style={styles.addressModalTitle}>Choose Address</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Input */}
          <View style={styles.searchBarWrap}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.DescriptionTextDark}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search street, city, zip code..."
              placeholderTextColor={Colors.PlaceholderInactive}
              value={addressQuery}
              onChangeText={searchAddress}
              style={styles.addressSearchInput}
              autoFocus={true}
              clearButtonMode="while-editing"
            />
            {searchingAddress && <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />}
          </View>

          {/* Predictions Dropdown / Search Results (Top of list) */}
          {addressPredictions.length > 0 && (
            <View style={styles.predictionsSection}>
              <Text style={styles.quickOptionsTitle}>Search Results</Text>
              <FlatList
                data={addressPredictions}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => selectPlacePrediction(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={Colors.ButtonPrimaryColor}
                      style={{ marginRight: 12, marginTop: 2 }}
                    />
                    <Text style={styles.predictionText}>{item.description}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Quick Preset Options */}
          <View style={styles.quickOptionsSection}>
            <Text style={styles.quickOptionsTitle}>Quick Suggestions</Text>
            <TouchableOpacity
              style={styles.quickOptionRow}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.8}
            >
              <View style={[styles.quickOptionIconWrap, { backgroundColor: "#EEF4FF" }]}>
                <Ionicons name="locate" size={20} color={Colors.ButtonPrimaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickOptionLabel}>Use Current Location</Text>
                <Text style={styles.quickOptionSub}>Auto-detect via GPS</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOptionRow}
              onPress={() => handleQuickPreset("Home")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickOptionIconWrap, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="home-outline" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickOptionLabel}>Home</Text>
                <Text style={styles.quickOptionSub}>Set as residential address</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickOptionRow}
              onPress={() => handleQuickPreset("Work")}
              activeOpacity={0.8}
            >
              <View style={[styles.quickOptionIconWrap, { backgroundColor: "#FDF2F8" }]}>
                <Ionicons name="briefcase-outline" size={20} color="#EC4899" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickOptionLabel}>Work</Text>
                <Text style={styles.quickOptionSub}>Set as business/workplace address</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
  inputLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: Spacing.md,
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  genderOptionActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#EEF4FF",
  },
  genderText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#64748B",
  },
  genderTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
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
    height: 48,
    marginBottom: Spacing.md,
  },
  datePickerTriggerText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  addressTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    marginBottom: Spacing.md,
  },
  addressTriggerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: Colors.ButtonPrimaryColor,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#64748B",
  },
  tabTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  rowInputs: {
    flexDirection: "row",
  },
  passwordToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
  },
  passwordToggleText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
  },
  reviewsContainer: {
    marginTop: Spacing.sm,
  },
  ratingSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  ratingBig: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  starIcon: {
    fontSize: 22,
    color: "#E5B652",
    marginHorizontal: 2,
  },
  ratingCount: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 4,
  },
  emptyReviews: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyReviewsText: {
    fontSize: FontSizes.sm,
    color: "#94A3B8",
    marginTop: 12,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E2E8F0",
  },
  reviewerName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  starMiniRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  starMini: {
    fontSize: 14,
    color: "#CBD5E1",
    marginRight: 2,
  },
  starMiniActive: {
    color: "#E5B652",
  },
  reviewText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
    marginTop: 10,
    lineHeight: 20,
  },

  // DOB Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  dobModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modalCloseBtn: {
    padding: 4,
  },
  dobPickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: Spacing.xl,
  },
  dobColumn: {
    flex: 1,
    alignItems: "center",
  },
  dobColumnLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  selectorBox: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingVertical: 8,
    width: "100%",
  },
  arrowBtn: {
    padding: 6,
  },
  selectorVal: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginVertical: 4,
  },
  modalFooter: {
    marginTop: Spacing.sm,
  },

  // Address Modal
  addressModalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  addressModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    padding: 4,
  },
  addressModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addressSearchInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  quickOptionsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  quickOptionsTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  quickOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  quickOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quickOptionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
  },
  quickOptionSub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
  },
  predictionsSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  predictionText: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
    flex: 1,
    lineHeight: 20,
  },
});


