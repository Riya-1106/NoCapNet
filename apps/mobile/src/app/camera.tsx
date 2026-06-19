import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useRef, useState, type ComponentType } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

const NativeCameraView = CameraView as unknown as ComponentType<any>;

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const ready = cameraPermission?.granted && microphonePermission?.granted;

  const captureSnap = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false
      });

      if (!photo?.uri) {
        throw new Error("Camera returned no photo URI.");
      }

      if (!mediaPermission?.granted) {
        const { granted } = await requestMediaPermission();
        if (!granted) return;
      }

      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      const album = await MediaLibrary.getAlbumAsync("NoCapNet");

      if (album === null) {
        await MediaLibrary.createAlbumAsync("NoCapNet", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      alert("Snap saved to the NoCapNet album.");
    } catch (err) {
      console.error(err);
      alert("Failed to capture snap.");
    } finally {
      setCapturing(false);
    }
  };

  if (!ready) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Camera check, bestie</Text>
        <Text style={styles.permissionCopy}>NoCapNet needs camera and mic access for snaps and videos.</Text>
        <Pressable
          style={styles.permissionButton}
          onPress={() => {
            void requestCameraPermission();
            void requestMicrophonePermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Allow access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NativeCameraView ref={cameraRef as any} style={styles.cameraFill} facing="back" mode="picture" />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.glassButton}>
          <Text style={styles.glassText}>✕</Text>
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.topCopy}>Private Save</Text>
        </View>
      </View>
      <View style={styles.captureRow}>
        <Pressable
          style={({ pressed }) => [styles.captureButton, { opacity: pressed || capturing ? 0.7 : 1 }]}
          onPress={captureSnap}
          disabled={capturing}
        >
          <View style={styles.captureInner}>{capturing && <ActivityIndicator color={colors.ink} />}</View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "black"
  },
  cameraFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    padding: 28
  },
  permissionTitle: {
    color: colors.cloud,
    fontSize: 30,
    fontWeight: "900"
  },
  permissionCopy: {
    color: colors.muted,
    textAlign: "center",
    marginVertical: 18
  },
  permissionButton: {
    backgroundColor: colors.cloud,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  permissionButtonText: {
    color: colors.ink,
    fontWeight: "900"
  },
  topBar: {
    paddingTop: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  glassButton: {
    backgroundColor: "#00000066",
    borderRadius: 999,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  glassText: {
    color: "white",
    fontSize: 20
  },
  badge: {
    backgroundColor: "#00000066",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },
  topCopy: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  captureRow: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  captureButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 6,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center"
  },
  captureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center"
  }
});
