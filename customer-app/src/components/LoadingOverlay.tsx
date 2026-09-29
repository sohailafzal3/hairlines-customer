import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Modal } from "react-native";
import { Colors } from "../theme/colors";

export function LoadingOverlay({ visible, message }: { visible: boolean; message?: string }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.contentBox}>
          <ActivityIndicator size="large" color={Colors.ButtonPrimaryColor} />
          {message ? <Text style={styles.messageText}>{message}</Text> : null}
        </View>
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
  contentBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  messageText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
});

export default LoadingOverlay;
