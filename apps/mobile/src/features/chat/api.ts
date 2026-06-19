import api from "../auth/api";
import { getCurrentUserId } from "../auth/api";
import { E2EEAdapter, type RemotePreKeyBundle } from "../crypto/e2ee";

export type ConversationSummary = {
  id: string;
  participants: Array<{
    user: {
      id: string;
      handle: string;
      displayName: string;
      onlineStatus: string;
      lastSeenAt: string | null;
    };
  }>;
  messages: Array<{
    id: string;
    kind: string;
    createdAt: string;
  }>;
};

export const listConversations = async () => {
  const { data } = await api.get<{ conversations: ConversationSummary[] }>("/messages/conversations");
  return data.conversations;
};

export const getConversationMessages = async (conversationId: string) => {
  const { data } = await api.get(`/messages/conversation/${conversationId}`);
  return data as {
    conversationId: string;
    participants: ConversationSummary["participants"];
    messages: Array<{ id: string; kind: string; createdAt: string }>;
  };
};

export const fetchPreKeyBundle = async (userId: string) => {
  const { data } = await api.get<RemotePreKeyBundle>(`/keys/fetch/${userId}`);
  return data;
};

export const sendEncryptedText = async (conversationId: string, recipientUserId: string, text: string) => {
  const bundle = await fetchPreKeyBundle(recipientUserId);
  const envelope = await E2EEAdapter.encryptForPreKeyBundle(
    text,
    "00000000-0000-4000-8000-000000000001",
    bundle
  );
  const { data } = await api.post("/messages/send", {
    conversationId,
    kind: "text",
    envelope
  });

  return data.message;
};

export const startLiveLocationShare = async (
  conversationId: string,
  encryptedLocationText: string,
  duration: "15m" | "1h" | "8h"
) => {
  const currentUserId = await getCurrentUserId();
  const conversation = await getConversationMessages(conversationId);
  const recipient = conversation.participants.find((participant) => participant.user.id !== currentUserId)?.user;
  if (!recipient) throw new Error("No recipient found for this conversation.");

  const bundle = await fetchPreKeyBundle(recipient.id);
  const encryptedPayload = await E2EEAdapter.encryptForPreKeyBundle(
    encryptedLocationText,
    "00000000-0000-4000-8000-000000000001",
    bundle
  );
  const { data } = await api.post("/messages/live-location/start", {
    conversationId,
    encryptedPayload,
    duration
  });
  return data.share;
};
