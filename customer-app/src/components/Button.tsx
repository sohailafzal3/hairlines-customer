import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "../theme/colors";
import { BorderRadius, Spacing } from "../theme/spacing";
import { FontSizes, FontWeights } from "../theme/fonts";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const normalizedVariant = variant === "outline" ? "ghost" : variant;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        styles[normalizedVariant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            normalizedVariant === "primary" || normalizedVariant === "danger"
              ? Colors.ButtonTextColor
              : Colors.ButtonPrimaryColor
          }
        />
      ) : (
        <Text style={[styles.text, styles[`${normalizedVariant}Text`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primary: {
    backgroundColor: Colors.ButtonPrimaryColor,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  secondary: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  danger: {
    backgroundColor: Colors.errorViewColor,
    shadowColor: Colors.errorViewColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.ButtonPrimaryColor,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  primaryText: { color: Colors.ButtonTextColor },
  secondaryText: { color: Colors.TitleColor },
  dangerText: { color: Colors.ButtonTextColor },
  ghostText: { color: Colors.ButtonPrimaryColor },
});

export default Button;
