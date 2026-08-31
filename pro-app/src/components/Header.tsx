import React, { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  title?: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  right?: ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  onMenuPress,
  onBackPress,
  right,
  style,
}: Props) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.side}>
        {onMenuPress ? (
          <TouchableOpacity onPress={onMenuPress} hitSlop={10}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
        ) : onBackPress ? (
          <TouchableOpacity onPress={onBackPress} hitSlop={10}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  side: { width: 40, alignItems: "center" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});
