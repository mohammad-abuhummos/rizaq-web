import { I18nManager, LogBox, Platform } from "react-native";
import "react-native-reanimated";
import "./i18n";

// Load Expo Router after configuring LogBox and globals
import "expo-router/entry";

// Suppress SafeAreaView deprecation warning coming from dependencies
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

// Force RTL globally
const shouldRTL = true;
if (I18nManager.isRTL !== shouldRTL) {
  I18nManager.allowRTL(shouldRTL);
  I18nManager.forceRTL(shouldRTL);
}

// On web, set dir attribute proactively
if (Platform.OS === "web") {
  try {
    document.documentElement.setAttribute("dir", "rtl");
  } catch {}
}
