import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { FontSizes, FontWeights } from "../theme/fonts";
import { Spacing } from "../theme/spacing";

interface Props {
  message?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  message,
  description,
  icon = "document-text-outline",
  style,
}: Props) {
  const displayMessage = description || message || "Nothing to show";
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={Colors.DescriptionTextDark} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{displayMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    minHeight: 220,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  text: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default EmptyState;
