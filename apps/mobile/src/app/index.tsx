import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import { Link } from "expo-router";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

const Gradient = LinearGradient as unknown as ComponentType<LinearGradientProps>;

export default function WelcomeScreen() {
  return (
    <Gradient colors={[colors.ink, colors.electricPurple, colors.blush]} style={styles.screen}>
      <View style={styles.logoBubble}>
        <Text style={styles.logo}>NCN</Text>
      </View>
      <Text style={styles.title}>NoCapNet</Text>
      <Text style={styles.subtitle}>Private snaps. Encrypted tea. Zero weird energy.</Text>
      <Link href="/auth/login" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Enter the vibe</Text>
        </Pressable>
      </Link>
      <Text style={styles.footnote}>Sign up with phone or email OTP. Google auth is scaffolded for provider keys.</Text>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28
  },
  logoBubble: {
    width: 118,
    height: 118,
    borderRadius: 38,
    backgroundColor: colors.cloud,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.blush,
    shadowOpacity: 0.45,
    shadowRadius: 28
  },
  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.drip
  },
  title: {
    marginTop: 28,
    color: "white",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.4
  },
  subtitle: {
    marginTop: 12,
    color: "#fff3",
    fontSize: 18,
    textAlign: "center"
  },
  cta: {
    marginTop: 36,
    backgroundColor: colors.cloud,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 999
  },
  ctaText: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 16
  },
  footnote: {
    marginTop: 22,
    color: "#ffffffaa",
    textAlign: "center",
    fontSize: 12
  }
});
