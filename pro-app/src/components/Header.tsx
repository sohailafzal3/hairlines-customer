import React, { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";
import { FontSizes, FontWeights } from "../theme/fonts";
import { Spacing } from "../theme/spacing";
import { useTheme } from "../context/ThemeContext";

interface Props {
  title?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onRightMenuPress?: () => void;
  right?: ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  onMenuPress,
  onBackPress,
  onRightMenuPress,
  right,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const { primaryColor } = useTheme();
  const displayTitle = title
    ? title.charAt(0).toUpperCase() + title.slice(1)
    : "";

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, height: 56 + insets.top },
        style,
      ]}
    >
      <View style={styles.side}>
        {onMenuPress ? (
          <TouchableOpacity onPress={onMenuPress} hitSlop={10}>
            <Ionicons name="menu" size={26} color={primaryColor} />
          </TouchableOpacity>
        ) : onBackPress ? (
          <TouchableOpacity onPress={onBackPress} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={primaryColor} />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {displayTitle}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {right ? (
          right
        ) : onRightMenuPress ? (
          <TouchableOpacity onPress={onRightMenuPress} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name="menu" size={24} color={primaryColor} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.BGColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
  },
  side: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  sideRight: { width: "auto", minWidth: 44, alignItems: "flex-end" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.NavigationTitle,
  },
});
