import { Link } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { listConversations, type ConversationSummary } from "../features/chat/api";
import { colors } from "../theme/colors";

type DisguiseMode = "NoCapNet" | "Camera" | "Notes";

export default function HomeScreen() {
  const [disguise, setDisguise] = useState<DisguiseMode>("NoCapNet");
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<ConversationSummary[]>([]);

  const loadConversations = useCallback(async () => {
    const savedDisguise = await SecureStore.getItemAsync("ncn_disguise");
    if (savedDisguise === "NoCapNet" || savedDisguise === "Camera" || savedDisguise === "Notes") {
      setDisguise(savedDisguise);
    }

    try {
      setChats(await listConversations());
    } catch {
      setChats([]);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{disguise === "NoCapNet" ? "Locked In" : disguise}</Text>
          <Text style={styles.title}>{disguise === "NoCapNet" ? "What’s the vibe?" : "Recent activity"}</Text>
        </View>
        <Link href="/settings" asChild>
          <Pressable style={styles.iconButton}>
            <Text style={styles.iconText}>⚙️</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.actionRow}>
        <Link href="/camera" asChild>
          <Pressable style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Send Snap</Text>
          </Pressable>
        </Link>
        <Link href="/friends" asChild>
          <Pressable style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Add code</Text>
          </Pressable>
        </Link>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cloud} />}
      >
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👻</Text>
            <Text style={styles.emptyTitle}>Zero motion here</Text>
            <Text style={styles.emptySubtitle}>No chats yet. Add a friend code to get the streaks moving.</Text>
          </View>
        ) : (
          chats.map((chat) => {
            const other = chat.participants[0]?.user;
            return (
              <Link key={chat.id} href={{ pathname: "/chat/[id]", params: { id: chat.id } }} asChild>
                <Pressable style={styles.chatCard}>
                  <View style={[styles.avatar, { backgroundColor: colors.drip }]}>
                    <Text style={styles.avatarText}>{(other?.displayName ?? "N")[0]}</Text>
                  </View>
                  <View style={styles.chatBody}>
                    <Text style={styles.chatName}>{other?.displayName ?? "NoCap friend"}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {chat.messages[0] ? "Encrypted message waiting 🔐" : "Say gm, respectfully"}
                    </Text>
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.streak}>🔥</Text>
                  </View>
                </Pressable>
              </Link>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingTop: 64,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  eyebrow: {
    color: colors.neonCyan,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12
  },
  title: {
    color: colors.cloud,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: {
    fontSize: 22
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 24
  },
  primaryAction: {
    flex: 1.5,
    backgroundColor: colors.cloud,
    borderRadius: 28,
    padding: 18
  },
  primaryActionText: {
    color: colors.ink,
    fontWeight: "900",
    textAlign: "center",
    fontSize: 16
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ffffff18"
  },
  secondaryActionText: {
    color: colors.cloud,
    fontWeight: "900",
    textAlign: "center",
    fontSize: 16
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1d1a27",
    padding: 16,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffffff08"
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: "white"
  },
  chatBody: {
    flex: 1
  },
  chatName: {
    color: colors.cloud,
    fontSize: 18,
    fontWeight: "900"
  },
  lastMessage: {
    color: "#ffffff66",
    marginTop: 4,
    fontSize: 14
  },
  meta: {
    alignItems: "flex-end"
  },
  streak: {
    color: colors.cloud,
    fontWeight: "900",
    fontSize: 14
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20
  },
  emptyTitle: {
    color: colors.cloud,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10
  },
  emptySubtitle: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 15
  }
});
