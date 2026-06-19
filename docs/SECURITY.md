# NoCapNet Security Plan

## Required Before Production

- Replace console-only OTP delivery with SMS/email provider delivery.
- Keep phone numbers and emails hashed with a server-side pepper.
- Implement device-based E2EE with audited libraries.
- The current mobile E2EE adapter is a development boundary and must be replaced with audited X3DH + Double Ratchet before real private-message launch.
- Use the pre-key routes only for public key material; never upload private keys.
- Add key verification, safety number changes, and device revocation.
- Encrypt media client-side before upload.
- Add signed URLs with short expiry and content-length checks.
- Add abuse reporting, blocking, rate limits, and account deletion.
- Add biometric app lock with secure fallback.
- Add privacy toggles for online status, last seen, read receipts, and location sharing.
- Run mobile and backend penetration testing before launch.

## Privacy Defaults

- Server stores encrypted envelopes only.
- Live location has strict TTL: 15 minutes, 1 hour, or 8 hours.
- Static location is sent only after explicit confirmation.
- Camera roll access is user initiated.
- App-created media goes to a private app album when supported by the OS.

## Threats To Track

- Account takeover via OTP abuse
- Malicious device added to an account
- Metadata leakage through push notifications
- Media URL leakage
- Location sharing after intended expiry
- Screenshot/screen-recording limitations by platform
