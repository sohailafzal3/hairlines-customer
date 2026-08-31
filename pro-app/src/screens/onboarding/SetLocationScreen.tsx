import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Header } from "../../components/Header";
import { GOOGLE_API_KEY } from "../../constants";
import { showAlert } from "../../utils/helpers";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SetLocation">;

interface Prediction {
  place_id: string;
  description: string;
}

export function SetLocationScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setPredictions([]);
      return;
    }
    try {
      setLoading(true);
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(text)}` +
        `&key=${GOOGLE_API_KEY}` +
        `&types=address`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === "OK") {
        setPredictions(json.predictions);
      } else {
        setPredictions([]);
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const select = async (prediction: Prediction) => {
    try {
      setLoading(true);
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${prediction.place_id}` +
        `&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const result = json.result;
      const components = result.address_components || [];
      const get = (type: string) =>
        components.find((c: any) => c.types.includes(type))?.long_name || "";

      navigation.navigate("PersonalInfo", {
        addressData: {
          address: result.formatted_address,
          city: get("locality") || get("sublocality"),
          state: get("administrative_area_level_1"),
          postalCode: get("postal_code"),
          latitude: result.geometry?.location?.lat,
          longitude: result.geometry?.location?.lng,
        },
      });
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Set Location" onBackPress={() => navigation.goBack()} />
      <TextInput
        style={styles.input}
        placeholder="Search address"
        value={query}
        onChangeText={search}
        autoFocus
      />
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : null}
      <FlatList
        data={predictions}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => select(item)}>
            <View style={styles.row}>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.place_id}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  input: {
    margin: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    fontSize: 16,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  description: { fontSize: 15, color: "#333" },
});
