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
import { useRouter } from "expo-router";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { colors } from "../../theme/colors";
import { requestOtp, verifyGoogleIdToken, uploadPreKeyBundle } from "../../features/auth/api";
import { registerForPushNotifications } from "../../features/push/api";
import { E2EEAdapter } from "../../features/crypto/e2ee";
import { Platform as RNPlatform } from "react-native";

const Gradient = LinearGradient as unknown as ComponentType<LinearGradientProps>;
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
  });

  React.useEffect(() => {
    const finishGoogle = async () => {
      if (googleResponse?.type !== "success") return;
      const idToken = googleResponse.params.id_token;
      if (!idToken) return;

      try {
        await verifyGoogleIdToken(idToken);
        const pushRegistration = await registerForPushNotifications();

        const bundle = await E2EEAdapter.generatePreKeyBundle(
          RNPlatform.OS,
          pushRegistration?.pushToken,
          pushRegistration?.deviceId
        );
        await uploadPreKeyBundle(bundle);

        router.replace("/home");
      } catch (error) {
        console.error(error);
        alert("Google sign-in is not configured yet.");
      }
    };

    void finishGoogle();
  }, [googleResponse, router]);

  const handleRequest = async () => {
    if (destination.length < 5) return;
    setLoading(true);
    try {
      const channel = destination.includes("@") ? "email" : "phone";
      await requestOtp(destination, channel);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/auth/verify",
        params: { destination, channel }
      });
    } catch (err) {
      console.error(err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Vibe check failed. Check your connection.");
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
        <Text style={styles.title}>What's the move?</Text>
        <Text style={styles.subtitle}>Enter your digits or email to get locked in.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Phone or email"
            placeholderTextColor="#ffffff44"
            keyboardType="email-address"
            autoCapitalize="none"
            value={destination}
            onChangeText={setDestination}
          />
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed || loading ? 0.8 : 1 }
          ]}
          onPress={handleRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.buttonText}>Send vibe-check code</Text>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
            By continuing, you agree to keep it 100 on NoCapNet.
        </Text>

        <Pressable style={styles.googleButton} onPress={() => void promptGoogle()}>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
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
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.cloud,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: "#ffffff66",
    marginTop: 8,
    marginBottom: 40,
  },
  inputContainer: {
    backgroundColor: "#ffffff08",
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ffffff11",
    marginBottom: 20,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  button: {
    backgroundColor: colors.cloud,
    paddingVertical: 20,
    borderRadius: 99,
    alignItems: "center",
    shadowColor: colors.cloud,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buttonText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  disclaimer: {
    marginTop: 24,
    textAlign: "center",
    color: "#ffffff33",
    fontSize: 12,
  },
  googleButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffffff20",
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: "center"
  },
  googleButtonText: {
    color: colors.cloud,
    fontWeight: "900",
    fontSize: 16
  }
});
