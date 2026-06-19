import api from "../auth/api";

export const getMyFriendCode = async () => {
  const { data } = await api.get<{ code: string; shareText: string }>("/friends/code");
  return data;
};

export const sendFriendRequest = async (code: string) => {
  const { data } = await api.post("/friends/request", { code });
  return data;
};

export const listFriendRequests = async () => {
  const { data } = await api.get("/friends/requests");
  return data.requests;
};

export const acceptFriendRequest = async (requestId: string) => {
  const { data } = await api.post(`/friends/requests/${requestId}/accept`);
  return data;
};

export const rejectFriendRequest = async (requestId: string) => {
  const { data } = await api.post(`/friends/requests/${requestId}/reject`);
  return data;
};
