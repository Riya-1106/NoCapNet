type ExpoPushMessage = {
  to: string;
  sound?: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export const sendExpoPushNotifications = async (messages: ExpoPushMessage[]) => {
  if (messages.length === 0) {
    return;
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    throw new Error(`Expo push send failed with ${response.status}.`);
  }
};
