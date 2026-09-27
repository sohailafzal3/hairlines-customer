import React from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { FontWeights } from "../theme/fonts";

interface Props {
  uri?: string;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: Props) {
  const initial = name ? name.charAt(0).toUpperCase() : "P";
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
  },
  initial: {
    color: Colors.ButtonTextColor,
    fontWeight: FontWeights.bold,
  },
});

