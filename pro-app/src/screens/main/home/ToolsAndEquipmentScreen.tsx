import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

import { useUser } from "../../../context/UserContext";
import { storage } from "../../../utils/storage";
import { StorageKeys } from "../../../constants";
import { navigationRef } from "../../../navigation/navigationRef";

type Props = NativeStackScreenProps<HomeTabParamList, "ToolsAndEquipment">;

const PRESET_TOOLS = [
  "Hair Clippers",
  "Hair Trimmer",
  "Shears / Scissors",
  "Blow Dryer",
  "Comb & Brush Set",
  "Straight Razor",
  "Disinfectant Spray",
  "Barber Cape / Apron",
  "Neck Duster",
  "Cleaning Vacuum",
  "Mop & Bucket",
  "Microfiber Towels",
  "Sanitizing Solution",
  "Rubber Gloves",
];

export function ToolsAndEquipmentScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();
  const isFromSettings = (route.params as any)?.isFromSettings;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tools, setTools] = useState<string[]>(user.tools || []);
  const [newTool, setNewTool] = useState("");

  const loadTools = async () => {
    try {
      setLoading(true);
      const res = await api.fetchTools();
      const fetched = res?.tools ?? [];
      if (fetched.length > 0) {
        setTools(fetched);
        await updateUser({ tools: fetched });
        await storage.set(StorageKeys.userTools, fetched);
      } else if (user.tools && user.tools.length > 0) {
        setTools(user.tools);
      } else {
        const localSaved = await storage.get<string[]>(StorageKeys.userTools);
        if (localSaved && localSaved.length > 0) {
          setTools(localSaved);
          await updateUser({ tools: localSaved });
        }
      }
    } catch (e: any) {
      if (user.tools && user.tools.length > 0) {
        setTools(user.tools);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const addCustomTool = () => {
    const trimmed = newTool.trim();
    if (!trimmed) return;
    if (tools.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      showAlert("Duplicate", `"${trimmed}" is already in your tools list.`);
      return;
    }
    setTools([trimmed, ...tools]);
    setNewTool("");
  };

  const togglePresetTool = (preset: string) => {
    if (tools.some((t) => t.toLowerCase() === preset.toLowerCase())) {
      setTools(tools.filter((t) => t.toLowerCase() !== preset.toLowerCase()));
    } else {
      setTools([preset, ...tools]);
    }
  };

  const removeTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  const save = async () => {
    let finalTools = [...tools];
    const pending = newTool.trim();
    if (pending && !finalTools.some((t) => t.toLowerCase() === pending.toLowerCase())) {
      finalTools = [pending, ...finalTools];
      setTools(finalTools);
      setNewTool("");
    }

    if (finalTools.length === 0) {
      showAlert("Required", "Please add at least one tool or piece of equipment.");
      return;
    }

    try {
      setSaving(true);
      await api.updateTools(finalTools);
      await updateUser({ tools: finalTools });
      await storage.set(StorageKeys.userTools, finalTools);
      showAlert("Success", "Tools & Equipment updated successfully!");
      if (isFromSettings) {
        if (navigationRef.isReady()) {
          navigationRef.navigate("Main", { screen: "Settings" } as any);
        } else {
          (navigation as any).navigate("Settings");
        }
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("HomeMap");
      }
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to update tools");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isFromSettings) {
      if (navigationRef.isReady()) {
        navigationRef.navigate("Main", { screen: "Settings" } as any);
      } else {
        (navigation as any).navigate("Settings");
      }
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeMap");
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Tools & Equipment"
        onBackPress={handleBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {/* Header Description Card */}
          <View style={styles.descCard}>
            <View style={styles.descIconBox}>
              <Ionicons
                name="construct-outline"
                size={22}
                color={Colors.ButtonPrimaryColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.descTitle}>Equipment Checklist</Text>
              <Text style={styles.descSubtitle}>
                Add the tools and supplies you carry to assure clients you are fully equipped for appointments.
              </Text>
            </View>
          </View>

          {/* Add Custom Tool Input */}
          <View style={styles.addCard}>
            <Text style={styles.sectionLabel}>ADD CUSTOM TOOL</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Input
                  value={newTool}
                  onChangeText={setNewTool}
                  placeholder="e.g. Cordless Foil Shaver"
                  onSubmitEditing={addCustomTool}
                  returnKeyType="done"
                  containerStyle={styles.noMarginInput}
                />
              </View>
              <TouchableOpacity
                onPress={addCustomTool}
                style={styles.addBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Suggestions / Presets */}
          <View style={styles.presetsCard}>
            <Text style={styles.sectionLabel}>POPULAR EQUIPMENT SUGGESTIONS</Text>
            <View style={styles.presetsGrid}>
              {PRESET_TOOLS.map((preset) => {
                const isSelected = tools.some(
                  (t) => t.toLowerCase() === preset.toLowerCase()
                );
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipActive,
                    ]}
                    onPress={() => togglePresetTool(preset)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                      size={16}
                      color={isSelected ? Colors.ButtonPrimaryColor : "#64748B"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selected Tools List */}
          <View style={styles.listSection}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionLabel}>
                MY EQUIPMENT LIST ({tools.length})
              </Text>
              {tools.length > 0 && (
                <TouchableOpacity onPress={() => setTools([])}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {tools.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No equipment listed yet.</Text>
                <Text style={styles.emptySub}>
                  Tap any preset above or type a tool name to add it.
                </Text>
              </View>
            ) : (
              tools.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.toolItemCard}>
                  <View style={styles.toolIconBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.ButtonPrimaryColor}
                    />
                  </View>
                  <Text style={styles.toolName}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => removeTool(index)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        {/* Action Button */}
        <View
          style={[
            styles.footerWrap,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Button
            title={`Save Equipment List (${tools.length})`}
            onPress={save}
            style={styles.saveBtn}
          />
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading || saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  scrollContent: {
    padding: Spacing.base,
  },
  descCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  descIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  descTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  descSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    lineHeight: 17,
  },
  addCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrap: {
    flex: 1,
    marginRight: 8,
  },
  noMarginInput: {
    marginBottom: 0,
  },
  addBtn: {
    height: 52,
    width: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: "center",
    justifyContent: "center",
  },
  presetsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetChipActive: {
    backgroundColor: "#EEF4FF",
    borderColor: Colors.ButtonPrimaryColor,
  },
  presetChipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: "#475569",
  },
  presetChipTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  listSection: {
    marginBottom: Spacing.base,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  clearAllText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: "#EF4444",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    marginTop: 4,
  },
  toolItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  toolIconBox: {
    marginRight: Spacing.sm,
  },
  toolName: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.TitleColor,
  },
  deleteBtn: {
    padding: 6,
  },
  footerWrap: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  saveBtn: {
    width: "100%",
  },
});


