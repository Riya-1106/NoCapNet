import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function RootLayout() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const unlock = async () => {
      const appLockEnabled = await SecureStore.getItemAsync("ncn_app_lock");

      if (appLockEnabled !== "true") {
        setUnlocked(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock NoCapNet",
        fallbackLabel: "Use device passcode"
      });

      setUnlocked(result.success);
    };

    void unlock();
  }, []);

  if (!unlocked) {
    return (
      <View style={styles.lockScreen}>
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.lockTitle}>Vibe locked</Text>
        <ActivityIndicator color={colors.neonCyan} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
    </>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.ink
  },
  lockIcon: {
    fontSize: 48
  },
  lockTitle: {
    color: colors.cloud,
    fontSize: 24,
    fontWeight: "900"
  }
});
