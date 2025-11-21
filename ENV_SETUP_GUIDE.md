# Environment Variables Setup Guide

## 📋 Quick Setup

1. **Create `.env` file in the root directory**
2. **Copy the content below into your `.env` file**
3. **Replace `YOUR_VAPID_KEY_HERE` with your actual Firebase VAPID key**

---

## 📄 .env File Content

```bash
# ============================================
# RIZAQ WEB APPLICATION - ENVIRONMENT VARIABLES
# ============================================

# --------------------------------------------
# API Configuration
# --------------------------------------------
VITE_API_URL=https://alhal.awnak.net
VITE_API_BASE_URL=https://alhal.awnak.net

# --------------------------------------------
# SignalR (Real-time Communication)
# --------------------------------------------
VITE_SIGNALR_HUB_URL=https://alhal.awnak.net

# --------------------------------------------
# Firebase Configuration
# --------------------------------------------
VITE_FIREBASE_API_KEY=AIzaSyAgSRBVMvec3CxML8qf2RrKxGyP43DEWbs
VITE_FIREBASE_AUTH_DOMAIN=rizaq-app-9b13f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rizaq-app-9b13f
VITE_FIREBASE_STORAGE_BUCKET=rizaq-app-9b13f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=685567565249
VITE_FIREBASE_APP_ID=1:685567565249:web:da7aed7ea8a7f733f5a340
VITE_FIREBASE_MEASUREMENT_ID=G-6YFM77D5Y5

# --------------------------------------------
# Firebase Cloud Messaging (FCM)
# --------------------------------------------
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE

# --------------------------------------------
# Application Configuration
# --------------------------------------------
VITE_APP_NAME=Rizaq
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

---

## 🔑 How to Get Firebase VAPID Key

### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/

2. **Select Your Project**
   - Click on `rizaq-app-9b13f`

3. **Open Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

4. **Navigate to Cloud Messaging**
   - Click on the "Cloud Messaging" tab

5. **Find Web Push Certificates**
   - Scroll down to the "Web Push certificates" section

6. **Generate or Copy Key**
   - If you already have a key pair, click "Show" and copy it
   - If not, click "Generate key pair" button
   - Copy the generated key

7. **Update .env File**
   - Replace `YOUR_VAPID_KEY_HERE` with the copied key

---

## 📝 Environment Variables Explained

### **API Configuration**
| Variable | Description | Current Value |
|----------|-------------|---------------|
| `VITE_API_URL` | Backend API base URL | `https://alhal.awnak.net` |
| `VITE_API_BASE_URL` | Alternative API URL (legacy) | `https://alhal.awnak.net` |

### **SignalR Configuration**
| Variable | Description | Current Value |
|----------|-------------|---------------|
| `VITE_SIGNALR_HUB_URL` | Real-time SignalR hub URL | `https://alhal.awnak.net` |

### **Firebase Configuration**
| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key for authentication |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app identifier |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID |
| `VITE_FIREBASE_VAPID_KEY` | **REQUIRED** - Web Push VAPID key |

### **Application Configuration**
| Variable | Description | Default Value |
|----------|-------------|---------------|
| `VITE_APP_NAME` | Application name | `Rizaq` |
| `VITE_APP_VERSION` | Current version | `1.0.0` |
| `VITE_APP_ENVIRONMENT` | Environment type | `production` |

---

## 🔧 Local Development Setup

For local development, create a `.env.local` file with:

```bash
VITE_API_URL=http://localhost:5000
VITE_SIGNALR_HUB_URL=http://localhost:5000
VITE_APP_ENVIRONMENT=development
```

This will override the production values only in your local environment.

---

## ⚠️ Important Notes

1. **Never commit `.env` to Git**
   - It's already in `.gitignore`
   - Contains sensitive keys

2. **VAPID Key is Required**
   - Without it, push notifications won't work
   - Get it from Firebase Console

3. **Environment Hierarchy**
   - `.env.local` overrides `.env`
   - `.env.production` for production builds
   - `.env.development` for development builds

4. **Restart Dev Server**
   - After changing `.env`, restart your dev server
   - Run: `npm run dev`

---

## ✅ Verification

To verify your environment variables are loaded:

1. Start your dev server: `npm run dev`
2. Open browser console
3. Type: `import.meta.env`
4. Check if your variables are listed

---

## 🚀 Quick Start Commands

```bash
# Create .env file
touch .env

# Copy template content
# (Paste the content from above)

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📞 Support

If you need help:
1. Check Firebase Console for correct values
2. Ensure VAPID key is generated
3. Restart dev server after changes
4. Check browser console for errors

---

## 🎯 Checklist

- [ ] Created `.env` file in root directory
- [ ] Copied all environment variables
- [ ] Got VAPID key from Firebase Console
- [ ] Replaced `YOUR_VAPID_KEY_HERE` with actual key
- [ ] Saved the file
- [ ] Restarted dev server
- [ ] Tested notifications

---

**Once you complete these steps, your web application will be fully configured!** 🎉

