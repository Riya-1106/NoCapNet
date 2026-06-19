import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

const IDENTITY_SECRET_KEY = "ncn_identity_secret";
const SIGNING_SECRET_KEY = "ncn_signing_secret";
const SIGNED_PREKEY_SECRET_PREFIX = "ncn_signed_prekey_secret:";
const ONE_TIME_PREKEY_SECRET_PREFIX = "ncn_one_time_prekey_secret:";

export type ClientEncryptedEnvelope = {
  version: 1;
  algorithm: "curve25519-xsalsa20poly1305";
  senderDeviceId: string;
  recipientDeviceId: string;
  nonce: string;
  ciphertext: string;
  keyId: string;
  sentAt: string;
};

export type PreKeyBundle = {
  deviceId?: string;
  platform: "ios" | "android" | "web";
  pushToken?: string;
  publicIdentityKey: string;
  signingPublicKey: string;
  signedPreKey: {
    keyId: string;
    publicKey: string;
    signature: string;
  };
  oneTimePreKeys: {
    keyId: string;
    publicKey: string;
  }[];
};

export type RemotePreKeyBundle = {
  userId: string;
  deviceId: string;
  publicIdentityKey: string;
  signingPublicKey: string;
  signedPreKey: {
    keyId: string;
    publicKey: string;
    signature: string;
  };
  oneTimePreKey: {
    keyId: string;
    publicKey: string;
  } | null;
};

const encode = naclUtil.encodeBase64;
const decode = naclUtil.decodeBase64;

const toSupportedPlatform = (platform: string): "ios" | "android" | "web" => {
  if (platform === "android" || platform === "web") return platform;
  return "ios";
};

export class E2EEAdapter {
  static async getOrGenerateIdentity(): Promise<nacl.BoxKeyPair> {
    const existingSecret = await SecureStore.getItemAsync(IDENTITY_SECRET_KEY);
    if (existingSecret) {
      return nacl.box.keyPair.fromSecretKey(decode(existingSecret));
    }

    const keyPair = nacl.box.keyPair();
    await SecureStore.setItemAsync(IDENTITY_SECRET_KEY, encode(keyPair.secretKey));
    return keyPair;
  }

  static async getOrGenerateSigningIdentity(): Promise<nacl.SignKeyPair> {
    const existingSecret = await SecureStore.getItemAsync(SIGNING_SECRET_KEY);
    if (existingSecret) {
      return nacl.sign.keyPair.fromSecretKey(decode(existingSecret));
    }

    const keyPair = nacl.sign.keyPair();
    await SecureStore.setItemAsync(SIGNING_SECRET_KEY, encode(keyPair.secretKey));
    return keyPair;
  }

  static async generatePreKeyBundle(
    platform: string,
    pushToken?: string,
    deviceId?: string
  ): Promise<PreKeyBundle> {
    const identity = await this.getOrGenerateIdentity();
    const signingIdentity = await this.getOrGenerateSigningIdentity();
    const signedPreKey = nacl.box.keyPair();
    const signedPreKeyId = Crypto.randomUUID();
    const signature = nacl.sign.detached(signedPreKey.publicKey, signingIdentity.secretKey);

    await SecureStore.setItemAsync(
      `${SIGNED_PREKEY_SECRET_PREFIX}${signedPreKeyId}`,
      encode(signedPreKey.secretKey)
    );

    const oneTimePreKeys = await Promise.all(
      Array.from({ length: 25 }).map(async () => {
        const preKey = nacl.box.keyPair();
        const keyId = Crypto.randomUUID();
        await SecureStore.setItemAsync(`${ONE_TIME_PREKEY_SECRET_PREFIX}${keyId}`, encode(preKey.secretKey));
        return {
          keyId,
          publicKey: encode(preKey.publicKey)
        };
      })
    );

    return {
      deviceId,
      platform: toSupportedPlatform(platform),
      pushToken,
      publicIdentityKey: encode(identity.publicKey),
      signingPublicKey: encode(signingIdentity.publicKey),
      signedPreKey: {
        keyId: signedPreKeyId,
        publicKey: encode(signedPreKey.publicKey),
        signature: encode(signature)
      },
      oneTimePreKeys
    };
  }

  static verifySignedPreKey(bundle: RemotePreKeyBundle) {
    return nacl.sign.detached.verify(
      decode(bundle.signedPreKey.publicKey),
      decode(bundle.signedPreKey.signature),
      decode(bundle.signingPublicKey)
    );
  }

  static async encryptMessage(
    plaintext: string,
    senderDeviceId: string,
    recipientDeviceId: string,
    recipientPublicKeyBase64: string,
    keyId: string
  ): Promise<ClientEncryptedEnvelope> {
    const identity = await this.getOrGenerateIdentity();
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
      naclUtil.decodeUTF8(plaintext),
      nonce,
      decode(recipientPublicKeyBase64),
      identity.secretKey
    );

    return {
      version: 1,
      algorithm: "curve25519-xsalsa20poly1305",
      senderDeviceId,
      recipientDeviceId,
      nonce: encode(nonce),
      ciphertext: encode(encrypted),
      keyId,
      sentAt: new Date().toISOString()
    };
  }

  static async encryptForPreKeyBundle(
    plaintext: string,
    senderDeviceId: string,
    bundle: RemotePreKeyBundle
  ): Promise<ClientEncryptedEnvelope> {
    if (!this.verifySignedPreKey(bundle)) {
      throw new Error("Recipient signed pre-key failed verification.");
    }

    const recipientKey = bundle.oneTimePreKey ?? bundle.signedPreKey;
    return this.encryptMessage(plaintext, senderDeviceId, bundle.deviceId, recipientKey.publicKey, recipientKey.keyId);
  }

  static async decryptMessage(envelope: ClientEncryptedEnvelope, senderPublicKeyBase64: string): Promise<string> {
    const secretKey =
      (await SecureStore.getItemAsync(`${ONE_TIME_PREKEY_SECRET_PREFIX}${envelope.keyId}`)) ??
      (await SecureStore.getItemAsync(`${SIGNED_PREKEY_SECRET_PREFIX}${envelope.keyId}`)) ??
      (await SecureStore.getItemAsync(IDENTITY_SECRET_KEY));

    if (!secretKey) {
      throw new Error("No local private key found for this encrypted envelope.");
    }

    const decrypted = nacl.box.open(
      decode(envelope.ciphertext),
      decode(envelope.nonce),
      decode(senderPublicKeyBase64),
      decode(secretKey)
    );

    if (!decrypted) {
      throw new Error("Failed to decrypt message. Invalid key or corrupted payload.");
    }

    return naclUtil.encodeUTF8(decrypted);
  }
}
