import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Mover } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "Workers">;

export function WorkersListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Mover[]>([]);

  useEffect(() => {
    api
      .getMerchantMovers()
      .then((res) => setWorkers(res.movers ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: Mover }) => (
    <Card style={styles.workerCard}>
      <View style={styles.row}>
        <Avatar uri={item.profileImage} name={item.name} size={48} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.badgePill}>
              <Ionicons name="briefcase-outline" size={11} color={Colors.ButtonPrimaryColor} style={{ marginRight: 3 }} />
              <Text style={styles.badgeText}>{item.jobsDone || 0} jobs</Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={11} color="#854D0E" style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{item.avgRating ? item.avgRating.toFixed(1) : "0.0"}</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Team / Workers"
        onBackPress={handleBack}
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateWorker")}
              style={styles.addBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              hitSlop={10}
              style={{ padding: 4 }}
            >
              <Ionicons name="menu" size={24} color={Colors.NavigationTitle} />
            </TouchableOpacity>
          </View>
        }
      />
      <FlatList
        data={workers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || item.name || `${Math.random()}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="people-outline"
              message="No workers added yet. Tap '+' to invite team members."
            />
          ) : null
        }
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },
  workerCard: {
    marginVertical: 4,
    padding: Spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
});

