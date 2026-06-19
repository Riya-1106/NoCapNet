import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { colors } from "../theme/colors";

type DisguiseMode = "NoCapNet" | "Camera" | "Notes";

export default function SettingsScreen() {
  const [appLock, setAppLock] = useState(false);
  const [disguise, setDisguise] = useState<DisguiseMode>("NoCapNet");

  useEffect(() => {
    const loadSettings = async () => {
      const savedLock = await SecureStore.getItemAsync("ncn_app_lock");
      const savedDisguise = await SecureStore.getItemAsync("ncn_disguise");

      setAppLock(savedLock === "true");
      if (savedDisguise === "NoCapNet" || savedDisguise === "Camera" || savedDisguise === "Notes") {
        setDisguise(savedDisguise);
      }
    };

    void loadSettings();
  }, []);

  const confirmAppLock = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        alert("Set up Face ID, Touch ID, or device lock first.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Lock NoCapNet with biometrics",
        fallbackLabel: "Use device passcode"
      });

      if (result.success) {
        setAppLock(true);
        await SecureStore.setItemAsync("ncn_app_lock", "true");
      }
      return;
    }

    setAppLock(false);
    await SecureStore.setItemAsync("ncn_app_lock", "false");
  };

  const handleDisguiseChange = async (option: DisguiseMode) => {
    setDisguise(option);
    await SecureStore.setItemAsync("ncn_disguise", option);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy cockpit</Text>
      <Text style={styles.subtitle}>Your app, your rules. Very main character.</Text>

      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>App lock</Text>
          <Text style={styles.cardCopy}>Require Face ID, Touch ID, or device lock before chats open.</Text>
        </View>
        <Switch
          value={appLock}
          onValueChange={confirmAppLock}
          trackColor={{ false: "#1d1a27", true: colors.drip }}
          thumbColor="white"
        />
      </View>

      <View style={styles.cardColumn}>
        <Text style={styles.cardTitle}>Disguise mode</Text>
        <Text style={styles.cardCopy}>
          Changes the in-app identity. OS-level icon/name disguise needs native release configuration and store review.
        </Text>
        <View style={styles.disguiseRow}>
          {(["NoCapNet", "Camera", "Notes"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => handleDisguiseChange(option)}
              style={[styles.disguisePill, disguise === option && styles.disguisePillActive]}
            >
              <Text style={[styles.disguiseText, disguise === option && styles.disguiseTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.cardColumn}>
        <Text style={styles.cardTitle}>Live location</Text>
        <Text style={styles.cardCopy}>Schema-ready for static location plus 15m, 1h, or 8h encrypted live sharing.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>NoCapNet v0.1.0 — Foundation Build</Text>
        <Text style={styles.footerText}>Locked in & secured</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink
  },
  content: {
    paddingTop: 64,
    paddingHorizontal: 20
  },
  title: {
    color: colors.cloud,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    marginBottom: 32,
    fontSize: 16
  },
  card: {
    backgroundColor: "#1d1a27",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffffff08"
  },
  cardInfo: {
    flex: 1,
    marginRight: 16
  },
  cardColumn: {
    backgroundColor: "#1d1a27",
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffffff08"
  },
  cardTitle: {
    color: colors.cloud,
    fontSize: 20,
    fontWeight: "900"
  },
  cardCopy: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 22,
    fontSize: 14
  },
  disguiseRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20
  },
  disguisePill: {
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#2a2638"
  },
  disguisePillActive: {
    backgroundColor: colors.neonCyan
  },
  disguiseText: {
    color: "#ffffff99",
    fontWeight: "800",
    fontSize: 14
  },
  disguiseTextActive: {
    color: colors.ink
  },
  footer: {
    marginTop: 40,
    paddingBottom: 60,
    alignItems: "center"
  },
  footerText: {
    color: "#ffffff33",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4
  }
});
