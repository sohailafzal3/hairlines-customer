import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Avatar } from "../../../components/Avatar";
import { openDialer } from "../../../utils/helpers";
import { api } from "../../../services/api";

type Props = NativeStackScreenProps<HomeTabParamList, "VoiceCall">;

export function VoiceCallScreen({ route, navigation }: Props) {
  const { callSid, phoneNumber } = route.params;
  const [caller, setCaller] = useState<{ name?: string; image?: string }>({});

  useEffect(() => {
    if (callSid) {
      api
        .twilioFetchCallData(callSid)
        .then((data) =>
          setCaller({ name: data.callerName, image: data.callerProfileImage })
        )
        .catch(() => {});
    }
  }, [callSid]);

  const endCall = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <Header title="Voice Call" onBackPress={endCall} />
      <View style={styles.center}>
        <Avatar uri={caller.image} name={caller.name} size={120} />
        <Text style={styles.name}>{caller.name || "Customer"}</Text>
        <Text style={styles.number}>{phoneNumber}</Text>
      </View>
      <View style={styles.actions}>
        {phoneNumber ? (
          <Button title="Call via Phone" onPress={() => openDialer(phoneNumber)} />
        ) : null}
        <View style={{ height: 12 }} />
        <Button title="End Call" variant="danger" onPress={endCall} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 24, fontWeight: "700", marginTop: 20, color: "#333" },
  number: { fontSize: 16, color: "#666", marginTop: 6 },
  actions: { padding: 24, paddingBottom: 40 },
});
