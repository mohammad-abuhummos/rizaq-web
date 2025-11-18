const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Point NativeWind to app/global.css (where Tailwind layers live)
module.exports = withNativeWind(config, { input: "./app/global.css" });
