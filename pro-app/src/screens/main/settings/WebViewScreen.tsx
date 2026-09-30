import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { WebView } from "react-native-webview";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";

type Props = DrawerScreenProps<MainDrawerParamList, "Terms">;

export function WebViewScreen({ route, navigation }: Props) {
  const params = (route.params as { url?: string; title?: string } | undefined) ?? {};
  const url = params.url ?? "https://hairlinesondemand.com/terms-conditions/";
  const title = params.title ?? "Terms";

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={title}
        onBackPress={handleBack}
        right={
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            hitSlop={10}
            style={{ padding: 4 }}
          >
            <Ionicons name="menu" size={24} color={Colors.NavigationTitle} />
          </TouchableOpacity>
        }
      />
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
