module.exports = {
  expo: {
    name: "TrackMyExpiry",
    slug: "trackmyexpiry",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    plugins: [
      "expo-router",
      "expo-barcode-scanner",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan receipts and capture product images."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos to select receipt and product images."
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "This app needs access to your camera to scan receipts and capture product images",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to select receipt and product images",
        UIBackgroundModes: ["remote-notification"]
      },
      bundleIdentifier: "com.trackmyexpiry.app",
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      package: "com.trackmyexpiry.app",
      googleServicesFile: "./google-services.json"
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};