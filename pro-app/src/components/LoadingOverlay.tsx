import React from "react";
import { View, ActivityIndicator, StyleSheet, Modal } from "react-native";
import { Colors } from "../theme/colors";

export function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={Colors.ButtonPrimaryColor} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});

