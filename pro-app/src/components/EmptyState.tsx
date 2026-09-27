import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
  message = "Nothing to show",
  icon = "document-text-outline",
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color="#BBB" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    marginTop: 12,
    fontSize: 15,
    color: "#888",
    textAlign: "center",
  },
});
