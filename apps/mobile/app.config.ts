import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "NoCapNet",
  slug: "nocapnet",
  scheme: "nocapnet",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.nocapnet.app",
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription: "NoCapNet uses your camera to capture private snaps.",
      NSMicrophoneUsageDescription: "NoCapNet uses your mic for videos and voice notes.",
      NSPhotoLibraryUsageDescription: "NoCapNet connects to your gallery when you choose media.",
      NSLocationWhenInUseUsageDescription: "NoCapNet shares live or static location only when you choose."
    }
  },
  android: {
    package: "com.nocapnet.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#070713"
    },
    permissions: [
      "CAMERA",
      "RECORD_AUDIO",
      "READ_MEDIA_IMAGES",
      "READ_MEDIA_VIDEO",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION"
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        "image": "./assets/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#070713"
      }
    ],
    "expo-secure-store",
    "expo-local-authentication",
    "expo-camera",
    "expo-location",
    "expo-media-library",
    "expo-notifications"
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    eas: {
      projectId: "90a11d90-335f-464f-a345-89a245c7d608"
    }
  }
};

export default config;
