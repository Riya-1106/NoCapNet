# NoCapNet Architecture

## Mobile

Expo React Native targets iOS and Android from one codebase. The app is organized around onboarding, chats, camera, private gallery, location sharing, and privacy settings.

## Backend

Fastify provides a small, auditable API:

- `/auth/*` for OTP, email, and Google sign-in
- `/friends/*` for friend code, friend links, and requests
- `/messages/*` for encrypted message envelopes
- `/media/*` for presigned uploads
- `/realtime/*` for WebSocket conversation events
- `/push/*` for push-token registration

## Data

PostgreSQL stores users, devices, friend requests, conversations, and encrypted message envelopes. Redis should be used for OTP attempts, rate limits, device presence, and live location TTLs. S3-compatible storage stores encrypted media blobs.

## Encryption Model

The backend must never receive plaintext messages or raw media. Mobile clients encrypt:

- Text directly into an encrypted envelope
- Images, videos, and audio before upload
- Media metadata inside the message envelope
- Static and live location coordinates before send

Use audited Signal Protocol style device keys for production. The included schema is designed for identity keys, signed prekeys, per-device delivery, and key rotation.

## Key Management

`/keys/upload` stores a device public identity key, signed pre-key, and one-time pre-keys. `/keys/fetch/:userId` returns a recipient bundle and atomically claims one one-time pre-key when available. Double Ratchet message sessions stay client-side; the server only brokers public key material.

## Media Storage

`/media/presign-upload` returns short-lived S3-compatible PUT URLs for encrypted image, video, and audio blobs. Clients must encrypt bytes before upload and send only encrypted metadata in message envelopes.

## Presence

Online, offline, typing, and last-seen should be derived from short-lived Redis heartbeats. Users must be able to hide last seen.

## Disguise Mode

Disguise mode should use platform-approved alternate app icons. The public store listing and user consent screens should remain transparent. Do not bypass OS security, parental controls, or enterprise device management.
