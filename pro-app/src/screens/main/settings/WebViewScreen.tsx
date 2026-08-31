import React from "react";
import { View, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";

type Props = NativeStackScreenProps<MainDrawerParamList, "Terms">;

export function WebViewScreen({ route, navigation }: Props) {
  const params = (route.params as { url?: string; title?: string } | undefined) ?? {};
  const url = params.url ?? "https://hairlinesondemand.com/terms-conditions/";
  const title = params.title ?? "Terms";
  return (
    <View style={styles.container}>
      <Header title={title} onBackPress={() => navigation.goBack()} />
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
