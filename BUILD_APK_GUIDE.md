# How to Build APK File for Shwapno Barcode Scanner

This guide will help you build an APK file for your Expo app using EAS Build (Expo Application Services).

## Prerequisites

1. **Expo Account**: You need a free Expo account
2. **EAS CLI**: Install the Expo Application Services CLI
3. **Node.js**: Already installed (you're using it)

## Step 1: Install EAS CLI

Open your terminal in the `app` directory and run:

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

If you don't have an account, create one at https://expo.dev/signup

## Step 3: Configure the Project

The project is already configured with:
- `eas.json` - Build configuration
- `app.json` - App configuration with Android package name

## Step 4: Build the APK

### Option A: Build Preview APK (Recommended for testing)

```bash
eas build --platform android --profile preview
```

This will:
- Build an APK file
- Allow you to download it directly
- Perfect for testing and sharing

### Option B: Build Production APK

```bash
eas build --platform android --profile production
```

This builds a production-ready APK.

### Option C: Build Development APK (for development/testing)

```bash
eas build --platform android --profile development
```

## Step 5: Download the APK

After the build completes:

1. You'll get a link in the terminal
2. Or visit https://expo.dev/accounts/[your-account]/builds
3. Click on the build and download the APK file

## Build Options

### Local Build (Requires Android SDK)

If you have Android SDK installed locally, you can build on your machine:

```bash
eas build --platform android --profile preview --local
```

### Build for Specific Architecture

By default, EAS builds universal APKs. To build for specific architectures, add to `eas.json`:

```json
"android": {
  "buildType": "apk",
  "gradleCommand": ":app:assembleRelease"
}
```

## Important Notes

1. **Package Name**: The package name is set to `com.acilogistics.shwapnobarcodescanner`. If you want to change it, update `app.json`.

2. **Version Code**: Currently set to `1`. Increment this number for each new build:
   ```json
   "versionCode": 2  // Increment for each release
   ```

3. **Version**: Update the version in `app.json`:
   ```json
   "version": "1.0.1"  // Update for each release
   ```

4. **First Build**: The first build might take 10-20 minutes. Subsequent builds are faster.

5. **Free Tier**: Expo's free tier includes:
   - Unlimited builds
   - Build queue (may wait during peak times)
   - 30-day build history

## Alternative: Build Locally with Android Studio

If you prefer to build locally without EAS:

1. **Prebuild native code**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Open in Android Studio**:
   - Open the `android` folder in Android Studio
   - Build > Build Bundle(s) / APK(s) > Build APK(s)
   - APK will be in `android/app/build/outputs/apk/release/`

## Troubleshooting

### Build Fails
- Check the build logs on expo.dev
- Ensure all dependencies are installed: `npm install`
- Verify `app.json` is valid

### APK Not Installing
- Enable "Install from Unknown Sources" on your Android device
- Check if the APK is signed (EAS Build signs it automatically)

### Need to Change Package Name
- Update `android.package` in `app.json`
- Update `versionCode` if re-uploading to Play Store

## Quick Commands Reference

```bash
# Login to Expo
eas login

# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

## Next Steps After Building

1. **Test the APK**: Install it on Android devices and test all features
2. **Share**: Share the APK with testers or upload to Google Play Store
3. **Update Version**: Increment `versionCode` and `version` for the next build

---

**Need Help?** Check the official Expo documentation: https://docs.expo.dev/build/introduction/

