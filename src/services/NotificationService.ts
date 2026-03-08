/**
 * NotificationService — Notifee-based local push notifications
 *
 * Provides:
 * - Channel creation (flight-alerts, reminders)
 * - Schedule leave-by reminders
 * - Schedule departure reminders (2 hrs and 30 min before)
 * - Cancel notifications per flight
 */
import notifee, {
  AndroidImportance,
  AndroidCategory,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

// ─── Channel IDs ───────────────────────────────────────────────────────────────
const CHANNEL_FLIGHT_ALERTS = 'flight-alerts';
const CHANNEL_REMINDERS = 'reminders';

// ─── Setup ─────────────────────────────────────────────────────────────────────

async function setup(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_FLIGHT_ALERTS,
    name: 'Flight Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.createChannel({
    id: CHANNEL_REMINDERS,
    name: 'Reminders',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

// ─── Request Permission ────────────────────────────────────────────────────────

async function requestPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  // authorizationStatus: 1 = AUTHORIZED
  return settings.authorizationStatus >= 1;
}

// ─── Schedule a Notification at a Specific Time ────────────────────────────────

async function scheduleAt(opts: {
  id: string;
  title: string;
  body: string;
  fireDate: Date;
  channel?: string;
}): Promise<void> {
  const fireMs = opts.fireDate.getTime();
  if (fireMs <= Date.now()) { return; } // Don't schedule past notifications

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireMs,
  };

  await notifee.createTriggerNotification(
    {
      id: opts.id,
      title: opts.title,
      body: opts.body,
      android: {
        channelId: opts.channel ?? CHANNEL_FLIGHT_ALERTS,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
      },
    },
    trigger,
  );
}

// ─── Leave-By Reminder ─────────────────────────────────────────────────────────
// Fires 15 minutes before the calculated leave-by time.

async function scheduleLeaveByReminder(opts: {
  flightIata: string;
  leaveByTime: Date;
  depIata: string;
}): Promise<void> {
  const fireDate = new Date(opts.leaveByTime.getTime() - 15 * 60 * 1000);
  await scheduleAt({
    id: `leaveby-${opts.flightIata}`,
    title: '🚗 Time to leave!',
    body: `Leave now for ${opts.depIata} — flight ${opts.flightIata} departs soon.`,
    fireDate,
    channel: CHANNEL_REMINDERS,
  });
}

// ─── Departure Reminders ───────────────────────────────────────────────────────
// Schedules two notifications: 2 hours before and 30 minutes before departure.

async function scheduleDepartureReminders(opts: {
  flightIata: string;
  departureTime: string; // ISO string
  depIata: string;
  terminal?: string;
  gate?: string;
}): Promise<void> {
  const depMs = new Date(opts.departureTime).getTime();

  // 2 hours before
  const twoHrBefore = new Date(depMs - 2 * 60 * 60 * 1000);
  await scheduleAt({
    id: `dep-2h-${opts.flightIata}`,
    title: `✈️ ${opts.flightIata} departs in 2 hours`,
    body: `From ${opts.depIata}${opts.terminal ? ` Terminal ${opts.terminal}` : ''}. Check-in if you haven't already.`,
    fireDate: twoHrBefore,
  });

  // 30 minutes before
  const thirtyMinBefore = new Date(depMs - 30 * 60 * 1000);
  await scheduleAt({
    id: `dep-30m-${opts.flightIata}`,
    title: `🛫 Boarding soon — ${opts.flightIata}`,
    body: `Boarding starts shortly${opts.gate ? ` at Gate ${opts.gate}` : ''}. Head to your gate now!`,
    fireDate: thirtyMinBefore,
  });
}

// ─── Cancel Flight Notifications ───────────────────────────────────────────────

async function cancelFlightNotifications(flightIata: string): Promise<void> {
  const ids = [
    `leaveby-${flightIata}`,
    `dep-2h-${flightIata}`,
    `dep-30m-${flightIata}`,
    `postflight-${flightIata}`,
  ];
  for (const id of ids) {
    try { await notifee.cancelNotification(id); } catch (_) { /* ignore */ }
  }
}

// ─── Post-Flight Re-Engagement ─────────────────────────────────────────────────
// Fires 5 hours after the flight's scheduled departure time.
// Encourages the user to review the trip / open the app.

async function schedulePostFlightReEngagement(opts: {
  flightIata: string;
  departureTime: string; // ISO string
  arrIata: string;
}): Promise<void> {
  const depMs  = new Date(opts.departureTime).getTime();
  const fireMs = depMs + 5 * 60 * 60 * 1000; // +5 hours

  await scheduleAt({
    id: `postflight-${opts.flightIata}`,
    title: `✅ You've landed in ${opts.arrIata}!`,
    body: `Hope your flight was smooth. Tap to plan your next trip or explore travel deals.`,
    fireDate: new Date(fireMs),
    channel: CHANNEL_REMINDERS,
  });
}

// ─── Cancel All ────────────────────────────────────────────────────────────────

async function cancelAll(): Promise<void> {
  await notifee.cancelAllNotifications();
}

// ─── Export ────────────────────────────────────────────────────────────────────

export const notificationService = {
  setup,
  requestPermission,
  scheduleAt,
  scheduleLeaveByReminder,
  scheduleDepartureReminders,
  schedulePostFlightReEngagement,
  cancelFlightNotifications,
  cancelAll,
};
