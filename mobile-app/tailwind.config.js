/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["Cairo"],
        "cairo-bold": ["Cairo-Bold"],
        "cairo-semibold": ["Cairo-SemiBold"],
        "cairo-light": ["Cairo-Light"],
        "cairo-medium": ["Cairo-Medium"],
        "cairo-extrabold": ["Cairo-ExtraBold"],
        "cairo-extralight": ["Cairo-ExtraLight"],
        "cairo-black": ["Cairo-Black"],
      },
    },
  },
  plugins: [],
};
