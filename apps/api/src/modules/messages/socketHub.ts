type RealtimeClient = {
  send: (payload: string) => void;
};

const rooms = new Map<string, Set<RealtimeClient>>();

export const joinConversationRoom = (conversationId: string, client: RealtimeClient) => {
  const clients = rooms.get(conversationId) ?? new Set<RealtimeClient>();
  clients.add(client);
  rooms.set(conversationId, clients);

  return () => {
    clients.delete(client);
    if (clients.size === 0) {
      rooms.delete(conversationId);
    }
  };
};

export const publishRealtimeMessage = (conversationId: string, payload: unknown) => {
  const clients = rooms.get(conversationId);

  if (!clients) {
    return;
  }

  const serialized = JSON.stringify(payload);
  for (const client of clients) {
    client.send(serialized);
  }
};
