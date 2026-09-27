import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Avatar } from "../../../components/Avatar";

type Props = NativeStackScreenProps<HomeTabParamList, "RateUser">;

export function RateUserScreen({ route, navigation }: Props) {
  const { jobId, userProfileId, name, image } = route.params as {
    jobId: string;
    userProfileId: string;
    name?: string;
    image?: string;
  };
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      await api.rateUser(jobId, userProfileId, rating, review);
      navigation.popTo("HomeMap");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Rate Customer" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Avatar uri={image} name={name} size={100} />
        <Text style={styles.name}>{name || "Customer"}</Text>
        <Text style={styles.label}>Tap a star to rate</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Text
              key={star}
              style={[styles.star, star <= rating && styles.starSelected]}
              onPress={() => setRating(star)}
            >
              ★
            </Text>
          ))}
        </View>
        <Input
          label="Feedback / Notes (optional)"
          placeholder="How was your experience with this customer?"
          multiline
          numberOfLines={3}
          value={review}
          onChangeText={setReview}
          containerStyle={{ width: "100%" }}
        />
        <Button title="Submit Rating" onPress={submit} style={{ width: "100%", marginTop: 8 }} />
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 24, alignItems: "center" },
  name: { fontSize: 20, fontWeight: "700", marginTop: 16, color: "#1E293B" },
  label: { fontSize: 14, color: "#64748B", marginTop: 20 },
  stars: { flexDirection: "row", marginVertical: 14 },
  star: { fontSize: 42, color: "#CBD5E1", marginHorizontal: 6 },
  starSelected: { color: "#E5B652" },
});

