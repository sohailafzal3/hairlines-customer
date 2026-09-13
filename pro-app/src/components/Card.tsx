import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Colors } from "../theme/colors";
import { BorderRadius, Spacing } from "../theme/spacing";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.CardColor,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    padding: Spacing.base,
    marginVertical: Spacing.sm,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
});

