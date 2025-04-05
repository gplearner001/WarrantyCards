module.exports = {
  expo: {
    name: "TrackMyExpiry",
    slug: "trackmyexpiry",
    owner: "gplearner001",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
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
      bundleIdentifier: "com.trackmyexpiry.app"
    },
    android: {
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      package: "com.trackmyexpiry.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      }
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
      eas: {
        projectId: "ca402e95-61c7-45bd-a805-ef66f1d5898b"
      }
    },
    updates: {
      url: "https://u.expo.dev/ca402e95-61c7-45bd-a805-ef66f1d5898b"
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
};