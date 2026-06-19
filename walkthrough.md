# NoCapNet Walkthrough

## What Is Ready

- Expo React Native mobile app for Android/iOS.
- Fastify + Prisma backend.
- PostgreSQL migrations.
- Render Blueprint deployment config.
- EAS Android APK build profile.
- OTP login with console/Twilio/Resend delivery abstraction.
- Google ID-token verification hook.
- Friend codes, friend requests, conversations, encrypted message envelopes.
- WebSocket realtime events.
- S3-compatible presigned media uploads.
- Camera capture and NoCapNet gallery album.
- App lock with local authentication.
- Live-location sharing endpoint and mobile UI.
- TweetNaCl-based crypto adapter with local SecureStore private keys, signed pre-key signatures, and uploaded pre-key bundles.

## What You Must Configure

- Render service URL in `apps/mobile/eas.json`.
- S3 bucket credentials in Render.
- OTP provider credentials if not using console OTP.
- Google OAuth client IDs.
- Expo/EAS account for APK builds.

## What Needs Professional Review Before Public Launch

- Full Signal-grade X3DH + Double Ratchet behavior.
- Key verification/safety-number UX.
- Device revocation and compromised-device flows.
- Abuse reporting and moderation flows.
- App Store / Play Store privacy disclosures.
