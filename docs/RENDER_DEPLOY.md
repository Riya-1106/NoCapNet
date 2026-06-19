# NoCapNet Render Deployment + Phone Testing Guide

This is the exact path to get NoCapNet running on Render, build an Android APK with EAS, and test it on a real phone.

## Current Repo Status

Already configured:

- Backend Docker image: `apps/api/Dockerfile`
- Render Blueprint: `render.yaml`
- PostgreSQL migrations: `apps/api/prisma/migrations`
- EAS build profiles: `apps/mobile/eas.json`
- Mobile API env support: `EXPO_PUBLIC_API_URL`
- Render health check: `/health`

Before real users, you still need real provider accounts/secrets:

- S3-compatible storage for media uploads
- Twilio or Resend for real OTP delivery
- Google OAuth client ID for Google sign-in
- Expo/EAS project credentials for push notifications and APK builds

## 1. Push Code To GitHub

Render deploys from a Git repo.

```bash
cd C:\App
git init
git add .
git commit -m "Prepare NoCapNet production deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nocapnet.git
git push -u origin main
```

If you already have a repo, only run:

```bash
git add .
git commit -m "Prepare NoCapNet production deploy"
git push
```

## 2. Create S3 Storage

Use AWS S3, Cloudflare R2, Backblaze B2, or any S3-compatible service.

Create a bucket, for example:

```text
nocapnet-media-prod
```

You need these values:

```text
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
S3_REGION
S3_FORCE_PATH_STYLE
```

For AWS S3:

```text
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
```

For Cloudflare R2 or MinIO-style providers, use their endpoint and usually:

```text
S3_FORCE_PATH_STYLE=true
```

## 3. Deploy Backend On Render

1. Open Render Dashboard.
2. Click `New +`.
3. Choose `Blueprint`.
4. Connect your GitHub repo.
5. Render should detect `render.yaml`.
6. Click `Apply`.

Render will create:

- `nocapnet-api` web service
- `nocapnet-db` PostgreSQL database

## 4. Add Required Render Environment Variables

Open:

```text
Render Dashboard → nocapnet-api → Environment
```

The Blueprint auto-generates:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
OTP_PEPPER
```

You must manually add or fill:

```text
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=nocapnet-media-prod
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
OTP_DELIVERY_DRIVER=console
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

For first testing, keep:

```text
OTP_DELIVERY_DRIVER=console
```

That means OTP codes appear in Render logs.

For real OTP later:

```text
OTP_DELIVERY_DRIVER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_PHONE=...
```

Or email OTP:

```text
OTP_DELIVERY_DRIVER=resend
RESEND_API_KEY=...
RESEND_FROM_EMAIL=NoCapNet <auth@yourdomain.com>
```

## 5. Verify Backend Is Live

After Render finishes deploying, copy your service URL:

```text
https://nocapnet-api.onrender.com
```

Open this in your browser:

```text
https://nocapnet-api.onrender.com/health
```

Expected response:

```json
{
  "ok": true,
  "service": "nocapnet-api",
  "vibe": "locked in, no cap"
}
```

If deploy fails:

1. Open `nocapnet-api → Logs`.
2. Check for missing env vars.
3. Make sure all `S3_*` values are filled.
4. Make sure Render Postgres is connected through `DATABASE_URL`.

## 6. Connect Mobile App To Render

Open:

```text
C:\App\apps\mobile\eas.json
```

Replace both placeholder API URLs:

```json
"EXPO_PUBLIC_API_URL": "https://api.nocapnet.example"
```

with your Render URL:

```json
"EXPO_PUBLIC_API_URL": "https://nocapnet-api.onrender.com"
```

Also set Google client ID if using Google login:

```json
"EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your_google_oauth_client_id"
```

If the key is missing, add it inside each profile's `env` object.

Example:

```json
"preview": {
  "android": {
    "buildType": "apk"
  },
  "distribution": "internal",
  "env": {
    "EXPO_PUBLIC_API_URL": "https://nocapnet-api.onrender.com",
    "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your_google_oauth_client_id"
  }
}
```

## 7. Build Android APK

From:

```bash
cd C:\App\apps\mobile
```

Login to Expo:

```bash
npx eas-cli login
```

Configure once:

```bash
npx eas-cli build:configure
```

Build an APK:

```bash
npx eas-cli build --platform android --profile preview
```

When EAS finishes, download the APK from the link and install it on your Android phone.

## 8. Phone Testing Checklist

Test in this order.

### Backend

- Open `/health`.
- Confirm Render logs show no crash loops.
- Confirm Prisma migrations ran during startup.

### OTP Login

1. Open the app.
2. Enter email or phone.
3. In Render logs, find:

   ```text
   VIBE-CHECK OTP
   ```

4. Enter the six-digit code.
5. App should enter Home.

### E2EE Key Upload

After login, Render logs should show no `/keys/upload` error.

Optional database check:

- `Device` row exists.
- `PublicIdentityKey` row exists.
- `SignedPreKey` row exists.
- `OneTimePreKey` rows exist.

### Friend Request

Use two accounts/devices:

1. Account A opens `Add code`.
2. Copy Account A's friend code.
3. Account B enters that code.
4. Account A accepts request.
5. A conversation should be created.

### Chat

1. Open conversation.
2. Send a message.
3. Confirm it appears as encrypted message.
4. In DB, `Message.envelope` should contain ciphertext, not plaintext.

### Camera + Gallery

1. Open camera.
2. Allow camera/mic/gallery permissions.
3. Take a snap.
4. Confirm `NoCapNet` album appears in gallery.

### Live Location

1. Open chat.
2. Tap `Live 15m`.
3. Allow location permission.
4. Confirm API creates a `LiveLocationShare`.

### App Lock

1. Open Settings.
2. Enable App Lock.
3. Force close app.
4. Reopen.
5. Confirm biometric/device prompt appears.

## 9. Store Release Checklist

Before Play Store/App Store:

- Replace placeholder icons in `apps/mobile/assets`.
- Add production privacy policy URL.
- Add terms of service URL.
- Add Play Store screenshots.
- Set real OTP provider, not `console`.
- Use production S3 bucket.
- Configure Google OAuth properly.
- Run security review of cryptography before marketing E2EE claims.

## Important Security Note

The app now uses TweetNaCl primitives, signed pre-keys, local SecureStore private keys, and encrypted message envelopes. However, this is still not a complete independently audited Signal Protocol implementation. Before real-world private messaging launch, get a professional security review or integrate a maintained Signal Protocol library.
