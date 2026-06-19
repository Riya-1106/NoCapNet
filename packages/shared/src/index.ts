import { z } from "zod";

export const friendCodeSchema = z
  .string()
  .trim()
  .regex(/^NCN-[A-Z0-9]{4}-[A-Z0-9]{4}$/u, "Use a valid NoCapNet friend code.");

export const encryptedEnvelopeSchema = z.object({
  version: z.literal(1),
  algorithm: z.enum(["curve25519-xsalsa20poly1305", "xchacha20poly1305", "aes-256-gcm"]),
  senderDeviceId: z.string().uuid(),
  recipientDeviceId: z.string().uuid(),
  nonce: z.string().min(16),
  ciphertext: z.string().min(1),
  keyId: z.string().min(8),
  sentAt: z.string().datetime()
});

export const messageKindSchema = z.enum([
  "text",
  "image",
  "video",
  "audio",
  "static_location",
  "live_location"
]);

export const liveLocationDurationSchema = z.enum(["15m", "1h", "8h"]);

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  kind: messageKindSchema,
  envelope: encryptedEnvelopeSchema,
  mediaObjectKey: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  liveLocationDuration: liveLocationDurationSchema.optional()
});

export const requestOtpSchema = z.object({
  channel: z.enum(["phone", "email"]),
  destination: z.string().min(5).max(320)
});

export const verifyOtpSchema = requestOtpSchema.extend({
  code: z.string().regex(/^[0-9]{6}$/u)
});

export const encodedPublicKeySchema = z.string().min(32).max(4096);

export const signedPreKeySchema = z.object({
  keyId: z.string().min(4).max(128),
  publicKey: encodedPublicKeySchema,
  signature: z.string().min(32).max(4096)
});

export const oneTimePreKeySchema = z.object({
  keyId: z.string().min(4).max(128),
  publicKey: encodedPublicKeySchema
});

export const uploadPreKeyBundleSchema = z.object({
  deviceId: z.string().uuid().optional(),
  platform: z.enum(["ios", "android", "web"]).default("ios"),
  pushToken: z.string().max(512).optional(),
  publicIdentityKey: encodedPublicKeySchema,
  signingPublicKey: encodedPublicKeySchema,
  signedPreKey: signedPreKeySchema,
  oneTimePreKeys: z.array(oneTimePreKeySchema).min(1).max(100)
});

export const fetchPreKeyBundleParamsSchema = z.object({
  userId: z.string().uuid()
});

export type EncryptedEnvelope = z.infer<typeof encryptedEnvelopeSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageKind = z.infer<typeof messageKindSchema>;
export type LiveLocationDuration = z.infer<typeof liveLocationDurationSchema>;
export type UploadPreKeyBundleInput = z.infer<typeof uploadPreKeyBundleSchema>;
