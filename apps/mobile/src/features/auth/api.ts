import axios from "axios";
import * as SecureStore from "expo-secure-store";
import type { PreKeyBundle } from "../crypto/e2ee";

// Use your computer's local IP address for physical device testing
// In development, this is often set via EXPO_PUBLIC_API_URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("nocapnet_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type AuthChannel = "phone" | "email";

export const requestOtp = async (destination: string, channel: AuthChannel) => {
  const { data } = await api.post("/auth/otp/request", { destination, channel });
  return data;
};

export const verifyOtp = async (destination: string, code: string, channel: AuthChannel) => {
  const { data } = await api.post("/auth/otp/verify", { destination, code, channel });
  if (data.accessToken) {
    await SecureStore.setItemAsync("nocapnet_token", data.accessToken);
  }
  if (data.user?.id) {
    await SecureStore.setItemAsync("nocapnet_user_id", data.user.id);
  }
  return data;
};

export const verifyGoogleIdToken = async (idToken: string) => {
  const { data } = await api.post("/auth/google", { idToken });
  if (data.accessToken) {
    await SecureStore.setItemAsync("nocapnet_token", data.accessToken);
  }
  if (data.user?.id) {
    await SecureStore.setItemAsync("nocapnet_user_id", data.user.id);
  }
  return data;
};

export const uploadPreKeyBundle = async (bundle: PreKeyBundle) => {
  const { data } = await api.post("/keys/upload", bundle);
  return data;
};

export const getCurrentUserId = () => SecureStore.getItemAsync("nocapnet_user_id");

export default api;
