import React, { useState } from "react";
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { BorderRadius, Spacing } from "../theme/spacing";
import { FontSizes, FontWeights } from "../theme/fonts";
import { useTheme } from "../context/ThemeContext";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = React.forwardRef<TextInput, Props>(
  (
    {
      label,
      error,
      containerStyle,
      style,
      secureTextEntry,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { primaryColor, primaryDarkColor } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(!!secureTextEntry);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <Text
            style={[
              styles.label,
              isFocused && [styles.labelFocused, { color: primaryDarkColor }],
              !!error && styles.labelError,
            ]}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.inputWrapper,
            isFocused && [
              styles.inputWrapperFocused,
              { borderColor: primaryColor, shadowColor: primaryColor },
            ],
            !!error && styles.inputWrapperError,
          ]}
        >
          <TextInput
            ref={ref}
            placeholderTextColor={Colors.placeholderGray}
            secureTextEntry={secureTextEntry ? isSecure : false}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            style={[styles.input, style]}
            {...rest}
          />
          {secureTextEntry ? (
            <TouchableOpacity
              onPress={() => setIsSecure(!isSecure)}
              style={styles.eyeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isSecure ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={isFocused ? primaryColor : "#64748B"}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons
              name="alert-circle"
              size={13}
              color={Colors.errorViewColor}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#334155",
    marginBottom: Spacing.xs,
  },
  labelFocused: {
    color: Colors.accentDark,
    fontWeight: FontWeights.bold,
  },
  labelError: {
    color: Colors.errorViewColor,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: Colors.ButtonPrimaryColor,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: Colors.errorViewColor,
    backgroundColor: "#FEF2F2",
  },
  input: {
    flex: 1,
    fontSize: FontSizes.base,
    color: "#0F172A",
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  error: {
    color: Colors.errorViewColor,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
  },
});

