# NoCapNet Production Roadmap

## Phase 1: Foundation

- Add SMS/email provider delivery for OTP.
- Add Redis-backed OTP throttling and global rate-limit state.
- Add production Google OAuth credentials.
- Add profile creation, handle claiming, and avatar upload.
- Add friend request accept/reject/block flows.

## Phase 2: Messaging

- Add per-device encrypted fanout.
- Add client-side X3DH + Double Ratchet implementation using audited libraries.
- Add encrypted media upload/download.
- Add native FCM/APNs credentials for store push delivery.
- Add typing, online, last seen, and read receipt privacy toggles.
- Add disappearing message policies.

## Phase 3: Camera And Gallery

- Capture photos and videos from `CameraView`.
- Save app-captured media into a NoCapNet private album.
- Attach gallery media through user-selected permissions.
- Add editing tools: caption, doodle, stickers, crop, timer.

## Phase 4: Location

- Send static encrypted location.
- Send live encrypted location with Redis TTL.
- Add stop-sharing controls and audit events.
- Add battery-aware background limits.

## Phase 5: Release

- Add EAS build profiles.
- Add app icons, adaptive icons, splash screens, and alternate icons.
- Add telemetry with privacy review.
- Add CI for typecheck, lint, test, and mobile builds.
- Complete App Store and Play Store privacy disclosures.
