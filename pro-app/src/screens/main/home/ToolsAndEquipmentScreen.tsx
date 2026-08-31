import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";

type Props = NativeStackScreenProps<HomeTabParamList, "ToolsAndEquipment">;

export function ToolsAndEquipmentScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<string[]>([]);
  const [newTool, setNewTool] = useState("");

  useEffect(() => {
    api
      .fetchTools()
      .then((res) => setTools(res.tools ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const addTool = () => {
    if (!newTool) return;
    setTools([...tools, newTool]);
    setNewTool("");
  };

  const removeTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  const save = async () => {
    try {
      setLoading(true);
      await api.updateTools(tools);
      navigation.goBack();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Tools & Equipment" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Input
          label="Add a tool"
          value={newTool}
          onChangeText={setNewTool}
          onSubmitEditing={addTool}
        />
        <Button title="Add" variant="secondary" onPress={addTool} />
        <FlatList
          data={tools}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.tool}>{item}</Text>
              <TouchableOpacity onPress={() => removeTool(index)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item, i) => `${item}-${i}`}
          contentContainerStyle={{ marginTop: 16 }}
        />
        <Button title="Save" onPress={save} />
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tool: { fontSize: 15, color: "#333" },
  remove: { color: "#C62828", fontSize: 16, fontWeight: "700" },
});
