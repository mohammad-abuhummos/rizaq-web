# Firebase Cloud Messaging (FCM) Setup for Web

## ✅ What Has Been Implemented

### 📁 Files Created

1. **`app/lib/utils/firebase.ts`** - Firebase initialization and configuration
2. **`app/lib/services/fcm.ts`** - FCM token management and foreground messages
3. **`app/lib/services/notification.ts`** - Notification storage and device registration
4. **`app/routes/notifications.tsx`** - Notifications page UI
5. **`app/hooks/useNotifications.ts`** - React hook for notification management
6. **`public/firebase-messaging-sw.js`** - Service worker for background notifications

### 🔧 Modified Files

1. **`app/root.tsx`** - Added service worker registration
2. **`app/routes.ts`** - Added notifications route
3. **`package.json`** - Added firebase dependency

---

## 🚀 Setup Instructions

### 1. **Get Firebase Cloud Messaging VAPID Key**

You need to get a VAPID key from Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rizaq-app-9b13f`
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Scroll down to **Web configuration**
5. Under **Web Push certificates**, click **Generate key pair**
6. Copy the generated key

### 2. **Add VAPID Key to Environment**

Create a `.env` file in the root directory (if it doesn't exist):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAgSRBVMvec3CxML8qf2RrKxGyP43DEWbs
VITE_FIREBASE_AUTH_DOMAIN=rizaq-app-9b13f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rizaq-app-9b13f
VITE_FIREBASE_STORAGE_BUCKET=rizaq-app-9b13f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=685567565249
VITE_FIREBASE_APP_ID=1:685567565249:web:da7aed7ea8a7f733f5a340
VITE_FIREBASE_MEASUREMENT_ID=G-6YFM77D5Y5

# IMPORTANT: Replace with your actual VAPID key from Firebase Console
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

### 3. **Update VAPID Key in Code**

Update the VAPID key in `app/lib/services/fcm.ts`:

```typescript
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';
```

Replace `YOUR_VAPID_KEY_HERE` with your actual VAPID key.

---

## 📋 Features Implemented

### ✅ Push Notification Support

- **Foreground notifications** - When app is open
- **Background notifications** - When app is in background or closed
- **Browser notifications** - Native browser notification API
- **Click actions** - Navigate to specific pages when notification is clicked

### ✅ Notification Management

- **Local storage** - Notifications are stored locally
- **Read/Unread status** - Track which notifications have been read
- **Delete notifications** - Remove individual notifications
- **Clear all** - Remove all notifications at once
- **Unread count** - Badge showing number of unread notifications

### ✅ Device Registration

- **Automatic registration** - Device registers with backend when user logs in
- **Device info collection** - Browser name, device type, platform
- **Token management** - FCM tokens are stored and managed

### ✅ User Interface

- **Notifications page** - View all notifications at `/notifications`
- **Empty states** - Beautiful empty state when no notifications
- **Loading states** - Proper loading indicators
- **Click to navigate** - Notifications can link to specific pages
- **RTL support** - Fully supports Arabic right-to-left layout

---

## 🔌 How to Use

### Initialize FCM (Done Automatically)

The FCM service is initialized automatically when the app loads. The service worker is registered in `app/root.tsx`.

### Request Permission

To start receiving notifications, the user needs to grant permission. You can add a button in your app:

```typescript
import { requestNotificationPermission, getFCMToken } from '~/lib/services/fcm';
import { registerDevice } from '~/lib/services/notification';

async function enableNotifications(userId: number) {
  // Request permission
  const granted = await requestNotificationPermission();
  
  if (granted) {
    // Get FCM token
    const token = await getFCMToken();
    
    if (token) {
      // Register device with backend
      await registerDevice(userId);
      
      console.log('Notifications enabled!');
    }
  }
}
```

### Use Notification Hook

In your components, use the `useNotifications` hook:

```typescript
import { useNotifications } from '~/hooks/useNotifications';

function MyComponent() {
  const { unreadCount, isSupported, updateUnreadCount } = useNotifications();

  return (
    <div>
      <Link to="/notifications">
        Notifications {unreadCount > 0 && `(${unreadCount})`}
      </Link>
    </div>
  );
}
```

---

## 📤 Sending Notifications from Backend

### API Endpoint

Your backend should have an endpoint to send notifications:

```
POST /api/notifications/send
```

### Notification Payload Structure

```json
{
  "userId": 123,
  "title": "New Message",
  "body": "You have a new message from Ahmad",
  "data": {
    "route": "/messages",
    "type": "message",
    "params": "{\"conversationId\": \"456\"}"
  }
}
```

### Notification Types

The notification system supports different action types:

```typescript
// Navigate to a specific route
{
  "action": {
    "type": "navigate",
    "route": "/auctions/123",
    "params": { "auctionId": "123" }
  }
}

// No action (just show notification)
{
  "action": {
    "type": "none"
  }
}
```

---

## 🎨 Notification Icons & Colors

The system automatically assigns icons and colors based on notification type:

- **Auctions** - Blue icon (#3B82F6)
- **Tenders** - Green icon (#10B981)
- **Orders/Direct** - Orange icon (#F59E0B)
- **Messages/Chat** - Purple icon (#8B5CF6)
- **Default** - Gray icon (#6B7280)

---

## 🔐 Security Notes

1. **VAPID Key** - Keep your VAPID key secret, use environment variables
2. **Service Worker** - The service worker is served from `/public` directory
3. **HTTPS Required** - Service workers and push notifications require HTTPS in production
4. **Token Storage** - FCM tokens are stored in localStorage
5. **Backend Validation** - Always validate tokens on the backend

---

## 🐛 Troubleshooting

### Issue: Service worker not registering

**Solution**: Make sure the file is in the `public` directory and accessible at `/firebase-messaging-sw.js`

### Issue: Permission denied

**Solution**: Check browser settings, some browsers block notifications by default

### Issue: No token received

**Solution**: 
1. Make sure VAPID key is correct
2. Check Firebase Console for project configuration
3. Ensure HTTPS is enabled (required in production)
4. Check browser console for errors

### Issue: Background notifications not working

**Solution**:
1. Verify service worker is registered (`navigator.serviceWorker.ready`)
2. Check that Firebase config in service worker matches your project
3. Test with browser DevTools → Application → Service Workers

### Issue: Notifications not showing in foreground

**Solution**: 
1. Check that `useNotifications` hook is used in a parent component
2. Verify `setupForegroundMessageListener` is called
3. Check browser console for errors

---

## 📱 Testing

### Test Foreground Notifications

1. Open the app in a browser
2. Grant notification permission
3. Keep the app tab active/focused
4. Send a test notification from Firebase Console or your backend
5. You should see a browser notification and it should appear in the notifications page

### Test Background Notifications

1. Open the app and grant permission
2. Switch to a different tab or minimize the browser
3. Send a test notification
4. You should receive a notification even when the app is not focused
5. Click the notification to navigate to the app

### Test from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click **Send your first message**
3. Enter title and message
4. Click **Send test message**
5. Paste your FCM token (from browser console or network tab)
6. Click **Test**

---

## 📊 Backend Integration

### Register Device Endpoint

```http
POST /api/notifications/devices/register?userId=123
Content-Type: application/json

{
  "token": "FCM_TOKEN_HERE",
  "deviceType": "desktop",
  "deviceId": "web-unique-id",
  "deviceName": "Chrome",
  "appVersion": "1.0.0",
  "platform": "web"
}
```

### Send Notification Endpoint (Example)

```http
POST /api/notifications/send
Content-Type: application/json
Authorization: Bearer YOUR_AUTH_TOKEN

{
  "userId": 123,
  "title": "New Auction",
  "body": "A new auction has been created",
  "data": {
    "route": "/auctions/456",
    "type": "auction"
  }
}
```

---

## 🎯 Next Steps

1. **Get VAPID Key** from Firebase Console
2. **Add it to `.env`** file
3. **Test notifications** using Firebase Console
4. **Integrate with backend** to send notifications on events
5. **Add notification triggers** for:
   - New messages
   - Auction updates
   - Tender responses
   - Order status changes
   - Chat messages

---

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## ✅ Checklist

- [x] Install Firebase SDK
- [x] Create Firebase configuration
- [x] Create FCM service
- [x] Create notification service
- [x] Create notifications page
- [x] Add service worker
- [x] Update routes
- [x] Add notification hook
- [ ] Get VAPID key from Firebase Console
- [ ] Add VAPID key to environment variables
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Integrate with backend notification system

---

## 🎉 You're All Set!

The notification system is now fully implemented! Just add your VAPID key and start testing.

For any issues or questions, check the troubleshooting section above.

