import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getCurrentUserId } from "../../features/auth/api";
import { getConversationMessages, sendEncryptedText, startLiveLocationShare } from "../../features/chat/api";
import { colors } from "../../theme/colors";

type ChatMessage = {
  id: string;
  kind: string;
  createdAt: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (!id) return;
      try {
        const [currentUserId, conversation] = await Promise.all([getCurrentUserId(), getConversationMessages(id)]);
        setMessages(conversation.messages);
        setRecipientUserId(
          conversation.participants.find((participant) => participant.user.id !== currentUserId)?.user.id ?? null
        );
      } catch {
        setMessages([]);
      }
    };

    void loadMessages();
  }, [id]);

  const sendMessage = async () => {
    if (!id || draft.trim().length === 0 || sending) return;
    setSending(true);

    try {
      if (!recipientUserId) {
        throw new Error("No recipient available for encryption.");
      }
      const message = await sendEncryptedText(id, recipientUserId, draft.trim());
      setMessages((current) => [...current, message]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  const shareLiveLocation = async (duration: "15m" | "1h" | "8h") => {
    if (!id) return;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationStatus("Location permission denied.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await startLiveLocationShare(
      id,
      JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date().toISOString()
      }),
      duration
    );
    setLocationStatus(`Live location shared for ${duration}.`);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.name}>Private chat</Text>
        <Text style={styles.meta}>online • E2EE envelope mode</Text>
      </View>

      <ScrollView style={styles.messages} contentContainerStyle={messages.length === 0 && styles.emptyState}>
        {messages.length === 0 ? (
          <>
            <Text style={styles.lock}>🔐</Text>
            <Text style={styles.emptyTitle}>Encrypted from jump</Text>
            <Text style={styles.emptyCopy}>Messages, snaps, voice notes, and locations ship as encrypted envelopes.</Text>
            <Text style={styles.conversationId}>Conversation {id}</Text>
          </>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.messageBubble}>
              <Text style={styles.messageText}>Encrypted {message.kind} message</Text>
              <Text style={styles.messageMeta}>{new Date(message.createdAt).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <Pressable style={styles.roundButton}>
          <Text>📍</Text>
        </Pressable>
        <TextInput
          placeholder="spill the tea..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={sendMessage}>
          <Text style={styles.sendText}>{sending ? "..." : "Send"}</Text>
        </Pressable>
      </View>
      <View style={styles.locationRow}>
        {(["15m", "1h", "8h"] as const).map((duration) => (
          <Pressable key={duration} style={styles.locationPill} onPress={() => void shareLiveLocation(duration)}>
            <Text style={styles.locationPillText}>Live {duration}</Text>
          </Pressable>
        ))}
      </View>
      {locationStatus.length > 0 && <Text style={styles.locationStatus}>{locationStatus}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingTop: 60,
    paddingHorizontal: 18
  },
  header: {
    paddingBottom: 18,
    borderBottomColor: "#ffffff14",
    borderBottomWidth: 1
  },
  name: {
    color: colors.cloud,
    fontSize: 24,
    fontWeight: "900"
  },
  meta: {
    color: colors.mint,
    marginTop: 4
  },
  messages: {
    flex: 1
  },
  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28
  },
  lock: {
    fontSize: 56
  },
  emptyTitle: {
    color: colors.cloud,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 16
  },
  emptyCopy: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22
  },
  conversationId: {
    color: "#ffffff3d",
    marginTop: 18,
    fontSize: 12
  },
  messageBubble: {
    alignSelf: "flex-end",
    maxWidth: "78%",
    backgroundColor: colors.drip,
    padding: 14,
    borderRadius: 22,
    marginTop: 14
  },
  messageText: {
    color: "white",
    fontWeight: "800"
  },
  messageMeta: {
    color: "#ffffff99",
    fontSize: 11,
    marginTop: 6
  },
  composer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 18
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    flex: 1,
    backgroundColor: "#1d1a27",
    borderRadius: 999,
    paddingHorizontal: 18,
    color: colors.cloud,
    height: 48
  },
  sendButton: {
    backgroundColor: colors.drip,
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonDisabled: {
    opacity: 0.7
  },
  sendText: {
    color: "white",
    fontWeight: "900"
  },
  locationRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8
  },
  locationPill: {
    backgroundColor: colors.glass,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  locationPillText: {
    color: colors.cloud,
    fontWeight: "800",
    fontSize: 12
  },
  locationStatus: {
    color: colors.mint,
    paddingBottom: 12,
    fontSize: 12
  }
});
