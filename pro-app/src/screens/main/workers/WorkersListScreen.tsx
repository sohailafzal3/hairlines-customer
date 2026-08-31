import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Mover } from "../../../types";

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
    <Card>
      <View style={styles.row}>
        <Avatar uri={item.profileImage} name={item.name} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>Jobs: {item.jobsDone} • Rating: {item.avgRating}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Workers"
        onMenuPress={() => navigation.openDrawer()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate("CreateWorker")}>
            <Ionicons name="add" size={28} color="#2E7D32" />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={workers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || item.name || `${Math.random()}`}
        contentContainerStyle={{ padding: 16 }}
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  meta: { fontSize: 13, color: "#666", marginTop: 2 },
});
