import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Colors } from "../theme/colors";
import { BorderRadius, Spacing } from "../theme/spacing";
import { FontSizes, FontWeights } from "../theme/fonts";
import { useTheme } from "../context/ThemeContext";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  textStyle,
}: Props) {
  const { primaryColor } = useTheme();
  const isDisabled = disabled || loading;

  const dynamicColorStyle =
    variant === "primary"
      ? { backgroundColor: primaryColor, shadowColor: primaryColor }
      : variant === "ghost"
      ? { borderColor: primaryColor }
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        styles[variant],
        style,
        dynamicColorStyle,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? Colors.ButtonTextColor
              : variant === "danger"
              ? "#FFFFFF"
              : primaryColor
          }
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
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
    shadowOpacity: 0.25,
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
    fontWeight: FontWeights.bold,
  },
  primaryText: { color: Colors.ButtonTextColor },
  secondaryText: { color: Colors.TitleColor },
  dangerText: { color: "#FFFFFF" },
  ghostText: { color: Colors.TitleColor },
});
