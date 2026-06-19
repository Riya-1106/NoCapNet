import React, { useState, type ComponentType } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "../../theme/colors";
import { verifyOtp, uploadPreKeyBundle, type AuthChannel } from "../../features/auth/api";
import { registerForPushNotifications } from "../../features/push/api";
import { E2EEAdapter } from "../../features/crypto/e2ee";
import { Platform as RNPlatform } from "react-native";

const Gradient = LinearGradient as unknown as ComponentType<LinearGradientProps>;

export default function VerifyScreen() {
  const { destination, channel } = useLocalSearchParams<{ destination: string; channel: AuthChannel }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(destination!, code, channel!);
      const pushRegistration = await registerForPushNotifications();
      
      const bundle = await E2EEAdapter.generatePreKeyBundle(
        RNPlatform.OS,
        pushRegistration?.pushToken,
        pushRegistration?.deviceId
      );
      await uploadPreKeyBundle(bundle);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/home");
    } catch (err) {
      console.error(err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Invalid code. No cap, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Gradient colors={[colors.ink, colors.midnight]} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Text style={styles.title}>Vibe Check</Text>
        <Text style={styles.subtitle}>
            Sent the code to {destination}. Drop it below.
        </Text>

        <TextInput
          style={styles.otpInput}
          maxLength={6}
          keyboardType="number-pad"
          placeholder="000000"
          placeholderTextColor="#ffffff11"
          autoFocus
          value={code}
          onChangeText={(text) => {
            setCode(text.replace(/\D/gu, ""));
          }}
        />

        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed || loading || code.length !== 6 ? 0.8 : 1 }
          ]}
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color={colors.cloud} />
          ) : (
            <Text style={styles.buttonText}>Lock it in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Wrong digits? Pull back</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.cloud,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffff66",
    marginTop: 8,
    marginBottom: 48,
    textAlign: "center",
    maxWidth: 280,
  },
  otpInput: {
    fontSize: 64,
    fontWeight: "900",
    color: colors.cloud,
    letterSpacing: 8,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.drip, // Use neon purple for verify
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 99,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  backButton: {
    marginTop: 24,
  },
  backText: {
    color: "#ffffff33",
    fontSize: 14,
    fontWeight: "600",
  }
});
