import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  acceptFriendRequest,
  getMyFriendCode,
  listFriendRequests,
  rejectFriendRequest,
  sendFriendRequest
} from "../features/friends/api";
import { colors } from "../theme/colors";

export default function FriendsScreen() {
  const [friendCode, setFriendCode] = useState("");
  const [shareText, setShareText] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      const code = await getMyFriendCode();
      setFriendCode(code.code);
      setShareText(code.shareText);
      setRequests(await listFriendRequests());
    } catch {
      setStatus("Log in first, then friend-code magic unlocks.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addFriend = async () => {
    try {
      const result = await sendFriendRequest(codeInput.trim().toUpperCase());
      setStatus(result.message ?? `Request status: ${result.status}`);
      setCodeInput("");
    } catch {
      setStatus("That code did not pass the vibe check.");
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Friend codes</Text>
      <Text style={styles.subtitle}>Add the crew without leaking your whole contact list.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your code</Text>
        <Text style={styles.code}>{friendCode || "Loading..."}</Text>
        <Text style={styles.copy}>{shareText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Add someone</Text>
        <TextInput
          value={codeInput}
          onChangeText={setCodeInput}
          autoCapitalize="characters"
          placeholder="NCN-ABCD-1234"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Pressable style={styles.button} onPress={addFriend}>
          <Text style={styles.buttonText}>Send request</Text>
        </Pressable>
        {status.length > 0 && <Text style={styles.status}>{status}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Incoming requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.copy}>No requests yet. Quiet era.</Text>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestRow}>
              <Text style={styles.requestName}>{request.sender.displayName}</Text>
              <View style={styles.rowActions}>
                <Pressable
                  style={styles.smallButton}
                  onPress={async () => {
                    await acceptFriendRequest(request.id);
                    await load();
                  }}
                >
                  <Text style={styles.smallButtonText}>Accept</Text>
                </Pressable>
                <Pressable
                  style={styles.ghostButton}
                  onPress={async () => {
                    await rejectFriendRequest(request.id);
                    await load();
                  }}
                >
                  <Text style={styles.ghostButtonText}>Nah</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  title: {
    color: colors.cloud,
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    marginBottom: 24
  },
  card: {
    backgroundColor: "#1d1a27",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffffff08"
  },
  label: {
    color: colors.neonCyan,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  code: {
    color: colors.cloud,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 12
  },
  copy: {
    color: colors.muted,
    marginTop: 10,
    lineHeight: 20
  },
  input: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.glass,
    color: colors.cloud,
    paddingHorizontal: 16,
    fontWeight: "800"
  },
  button: {
    marginTop: 14,
    backgroundColor: colors.neonCyan,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: colors.ink,
    fontWeight: "900"
  },
  status: {
    color: colors.cloud,
    marginTop: 12
  },
  requestRow: {
    marginTop: 16,
    gap: 12
  },
  requestName: {
    color: colors.cloud,
    fontWeight: "900",
    fontSize: 17
  },
  rowActions: {
    flexDirection: "row",
    gap: 10
  },
  smallButton: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  smallButtonText: {
    color: colors.ink,
    fontWeight: "900"
  },
  ghostButton: {
    backgroundColor: colors.glass,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  ghostButtonText: {
    color: colors.cloud,
    fontWeight: "900"
  }
});
