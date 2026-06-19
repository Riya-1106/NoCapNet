import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import api from "../auth/api";

export const registerForPushNotifications = async () => {
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  const { data } = await api.post("/push/register", {
    platform: Platform.OS,
    pushToken: token.data
  });

  return {
    pushToken: token.data,
    deviceId: data.deviceId as string
  };
};
