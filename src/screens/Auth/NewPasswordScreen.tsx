import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';

const NewPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set New Password</Text>
        <VTTextField label="New Password" placeholder="Enter new password" value={password} onChangeText={setPassword} secureTextEntry />
        <VTTextField label="Confirm Password" placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <VTButton title="Reset Password" onPress={() => {}} disabled={!password || password !== confirmPassword} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BGColor },
  content: { flex: 1, padding: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontFamily: Fonts.uberMoveBold, color: Colors.TitleColor, marginBottom: Spacing.lg },
});

export default NewPasswordScreen;
