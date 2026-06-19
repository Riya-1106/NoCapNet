# NoCapNet Deployment Guide

This guide gets NoCapNet onto a real phone first, then into production hosting and app stores.

## 1. Local Phone Testing With Expo

Use this when you want to test quickly on your Android or iPhone.

1. Install Expo Go on your phone.
2. Find your computer LAN IP, for example `192.168.1.20`.
3. Create `apps/mobile/.env`:

   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
   ```

4. Start the API from the repo root:

   ```bash
   npm run dev:api
   ```

5. Start mobile:

   ```bash
   npm run dev:mobile
   ```

6. Scan the QR code with Expo Go.

If the phone cannot connect, make sure the phone and computer are on the same Wi-Fi and Windows Firewall allows port `4000`.

## 2. Android APK For Direct Install

Use this to generate an APK that can be installed like a normal Android app.

1. Install EAS CLI:

   ```bash
   npm install -g eas-cli
   ```

2. Log in:

   ```bash
   eas login
   ```

3. From `apps/mobile`, configure the project:

   ```bash
   cd apps/mobile
   eas build:configure
   ```

4. Edit `apps/mobile/eas.json` and replace `https://api.nocapnet.example` with your deployed API URL.
5. Build an APK:

   ```bash
   eas build --platform android --profile preview
   ```

6. Download the APK from the EAS link and install it on your Android phone.

## 3. iPhone Testing

For iOS, you need an Apple Developer account for real device builds.

```bash
cd apps/mobile
eas build --platform ios --profile preview
```

EAS will guide you through certificates and provisioning profiles.

## 4. Backend Deployment

You can deploy the API to Railway, Render, Fly.io, AWS, or DigitalOcean.

Required production env vars are listed in `apps/api/.env.production.example`.

Minimum backend steps:

```bash
npm --workspace apps/api run prisma:deploy
npm --workspace apps/api run build
npm --workspace apps/api run start
```

For Railway, `apps/api/railway.toml` and `apps/api/Dockerfile` are included.

## 5. Storage Setup

For production media, create an S3-compatible bucket and set:

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=nocapnet-media-prod
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
```

For MinIO/local S3, keep `S3_FORCE_PATH_STYLE=true`.

## 6. OTP Setup

Current default:

```bash
OTP_DELIVERY_DRIVER=console
```

Production options:

- `OTP_DELIVERY_DRIVER=twilio` for phone OTP.
- `OTP_DELIVERY_DRIVER=resend` for email OTP.

Add the matching `TWILIO_*` or `RESEND_*` keys in the backend environment.

## 7. Store Release Checklist

- Replace placeholder app icon/splash assets with final brand art.
- Add privacy policy and terms URLs.
- Add App Store and Play Store screenshots.
- Configure FCM/APNs push notifications.
- Complete Google OAuth provider setup and set `GOOGLE_CLIENT_ID` plus `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Replace the development E2EE adapter with audited client-side X3DH + Double Ratchet.
- Run physical-device tests for camera, mic, gallery, app lock, location, and OTP.
