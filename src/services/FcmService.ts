/**
 * FcmService — Firebase Cloud Messaging (app-side)
 *
 * Responsibilities:
 * 1. Request notification permission
 * 2. Get the FCM device token and save it to Firestore users/{uid}.fcmToken
 * 3. Listen for foreground push messages and show them via Notifee
 * 4. Handle notification-open-app events and return the target screen
 *
 * Install:
 *   npm install @react-native-firebase/messaging
 *   (No additional native config needed — auto-links with RN Firebase v20+)
 */
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { notificationService } from './NotificationService';

// ─── Save token to Firestore ──────────────────────────────────────────────────

async function saveTokenForUser(uid: string): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (!token) { return; }
    await firestore().collection('users').doc(uid).set(
      { fcmToken: token, fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
  } catch {
    // Non-fatal — background push won't work but local notifications still will
  }
}

// ─── Request permission ───────────────────────────────────────────────────────

async function requestPermission(): Promise<boolean> {
  try {
    const status = await messaging().requestPermission();
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

// ─── Foreground message handler ───────────────────────────────────────────────

function onForegroundMessage(
  onNavigate: (screen: string, params: Record<string, string>) => void,
): () => void {
  return messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const { title, body } = remoteMessage.notification ?? {};
    const data = remoteMessage.data ?? {};

    // Show via Notifee so it respects channel importance
    if (title && body) {
      await notificationService.scheduleAt({
        id:       `fcm-${Date.now()}`,
        title,
        body,
        fireDate: new Date(Date.now() + 500), // near-immediate
      });
    }

    // If user taps inside the app (foreground) navigate to the right screen
    if (data.screen) {
      onNavigate(data.screen as string, data as Record<string, string>);
    }
  });
}

// ─── Background / quit state open handler ────────────────────────────────────

/**
 * Call once on app startup (before navigation is ready).
 * Returns the initial screen to navigate to if app was opened via a notification.
 */
async function getInitialNotificationScreen(): Promise<{
  screen: string;
  params: Record<string, string>;
} | null> {
  try {
    const msg = await messaging().getInitialNotification();
    const data = msg?.data;
    if (data?.screen) {
      return { screen: data.screen as string, params: data as Record<string, string> };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Call once on app startup to handle notifications that opened the app
 * from background (not killed) state.
 */
function onBackgroundNotificationOpen(
  onNavigate: (screen: string, params: Record<string, string>) => void,
): () => void {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    const data = remoteMessage.data ?? {};
    if (data.screen) {
      onNavigate(data.screen as string, data as Record<string, string>);
    }
  });
}

// ─── Background message handler (must be registered at app root) ─────────────

/**
 * Register this in index.js (root entry point), NOT inside a component.
 *
 * Usage in index.js:
 *   import { setBackgroundMessageHandler } from './src/services/FcmService';
 *   setBackgroundMessageHandler();
 */
function setBackgroundMessageHandler(): void {
  messaging().setBackgroundMessageHandler(async (_remoteMessage) => {
    // Notification is automatically shown by the system in background/quit state.
    // No additional work needed here.
  });
}

// ─── Token refresh listener ───────────────────────────────────────────────────

function onTokenRefresh(uid: string): () => void {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      await firestore().collection('users').doc(uid).set(
        { fcmToken: newToken, fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
    } catch {}
  });
}

export const fcmService = {
  requestPermission,
  saveTokenForUser,
  onForegroundMessage,
  onBackgroundNotificationOpen,
  getInitialNotificationScreen,
  setBackgroundMessageHandler,
  onTokenRefresh,
};
