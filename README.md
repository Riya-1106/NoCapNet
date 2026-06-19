# NoCapNet

NoCapNet is a privacy-first, Snapchat-inspired mobile chat app foundation for iOS and Android.

## Stack

- Mobile: Expo + React Native + Expo Router
- Backend: Fastify + TypeScript
- Data: PostgreSQL + Prisma
- Cache/jobs: Redis-ready
- Media: S3-compatible object storage
- Privacy: E2EE envelope contracts, X3DH pre-key bundle APIs, app lock, disappearing sharing windows, live/static location contracts

## Start Locally

```bash
npm install
docker compose up -d
npm --workspace apps/api run prisma:migrate
npm run dev:api
npm run dev:mobile
```

## Product Scope

Implemented foundation:

- OTP/email auth route structure with Prisma persistence
- Friend code and friend request API structure
- Persistent friends, conversations, encrypted-envelope messages, and realtime sockets
- Mobile friend-code UI, Google sign-in hook, push-token registration, and live-location sharing UI
- Pre-key bundle upload/fetch routes for offline E2EE handshakes
- S3-compatible presigned media uploads
- Encrypted text/media/location message contracts
- Mobile onboarding, chat home, conversation, camera, and privacy settings screens
- GenZ-friendly UI copy and animated interaction points
- Production security and deployment roadmap

Production integrations still needed before launch:

- Real SMS provider, email provider, Google OAuth client IDs
- Native FCM/APNs production credentials for store builds
- Security review and replacement of the development E2EE adapter with audited X3DH + Double Ratchet
- Signal-style double-ratchet key management audit
- App Store / Play Store dynamic icon compliance review

See `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/ROADMAP.md`.

For phone installation and deployment steps, see `docs/DEPLOYMENT.md`.
