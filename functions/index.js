/**
 * ReadyToFly — Firebase Cloud Functions
 *
 * pollFlights: Runs every 5 minutes. For each active flight departing within
 * the next 3 hours, checks AeroDataBox for gate/status changes and sends
 * FCM push notifications to the user's device.
 *
 * Deploy:
 *   cd functions && npm install
 *   firebase deploy --only functions
 *
 * Set secrets:
 *   firebase functions:secrets:set AERODATABOX_KEY
 *   firebase functions:secrets:set AERODATABOX_HOST
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// ─── Config ────────────────────────────────────────────────────────────────────

// Set via: firebase functions:secrets:set AERODATABOX_KEY
const AERODATABOX_KEY  = process.env.AERODATABOX_KEY  ?? functions.config().aerodatabox?.key  ?? '';
const AERODATABOX_HOST = process.env.AERODATABOX_HOST ?? functions.config().aerodatabox?.host ?? 'aerodatabox.p.rapidapi.com';
const AERODATABOX_BASE = `https://${AERODATABOX_HOST}`;

// ─── AeroDataBox fetch ──────────────────────────────────────────────────────────

async function fetchLiveStatus(flightIata) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const url   = `${AERODATABOX_BASE}/flights/number/${encodeURIComponent(flightIata)}/${today}`;
    const res   = await fetch(url, {
      headers: {
        'x-rapidapi-key':  AERODATABOX_KEY,
        'x-rapidapi-host': AERODATABOX_HOST,
        'Accept':          'application/json',
      },
    });
    if (!res.ok) { return null; }
    const json    = await res.json();
    const flights = Array.isArray(json) ? json : [json];
    const f       = flights[0];
    if (!f) { return null; }

    return {
      gate:          f.departure?.gate         ?? null,
      terminal:      f.departure?.terminal     ?? null,
      status:        f.status                  ?? 'scheduled',
      baggageBelt:   f.arrival?.baggageClaim   ?? null,
      arrGate:       f.arrival?.gate           ?? null,
      arrTerminal:   f.arrival?.terminal       ?? null,
      departureTime: f.departure?.revisedTime  ?? f.departure?.scheduledTime ?? null,
    };
  } catch (err) {
    functions.logger.warn(`AeroDataBox fetch failed for ${flightIata}:`, err.message);
    return null;
  }
}

// ─── FCM send helpers ───────────────────────────────────────────────────────────

async function sendPush(fcmToken, title, body, data = {}) {
  if (!fcmToken) { return; }
  try {
    await admin.messaging().send({
      token:   fcmToken,
      notification: { title, body },
      data:    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: { channelId: 'flight-alerts', sound: 'default' },
      },
    });
  } catch (err) {
    functions.logger.warn('FCM send failed:', err.message);
  }
}

// ─── Main poll function ─────────────────────────────────────────────────────────

/**
 * Runs every 5 minutes (Cloud Scheduler).
 * For every user, checks flights departing in the next 3 hours.
 */
exports.pollFlights = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const now       = Date.now();
    const threeHrsMs = 3 * 60 * 60 * 1000;

    // Get all users who have an FCM token stored
    const usersSnap = await db.collection('users').where('fcmToken', '!=', null).get();
    functions.logger.info(`Polling ${usersSnap.size} users with FCM tokens`);

    for (const userDoc of usersSnap.docs) {
      const uid      = userDoc.id;
      const fcmToken = userDoc.data().fcmToken;

      // Get this user's active flights
      const flightsSnap = await db
        .collection('users').doc(uid)
        .collection('flights')
        .get();

      for (const flightDoc of flightsSnap.docs) {
        const flight = flightDoc.data();
        const depTimeStr = flight.dep?.actualTime || flight.dep?.estimatedTime || flight.dep?.scheduledTime;
        if (!depTimeStr) { continue; }

        const depMs   = new Date(depTimeStr).getTime();
        const diffMs  = depMs - now;

        // Only poll flights departing within the next 3 hours
        // (and not more than 30 min past departure — allow boarding window)
        if (diffMs > threeHrsMs || diffMs < -30 * 60 * 1000) { continue; }

        const flightIata = flight.flightIata;
        functions.logger.info(`Checking ${flightIata} for user ${uid}`);

        let liveData;
        try {
          liveData = await fetchLiveStatus(flightIata);
        } catch (_) { continue; }
        if (!liveData) { continue; }

        const updates = {};

        // ── Gate change detection ──────────────────────────────────────────────
        const storedGate = flight.dep?.gate ?? null;
        const newGate    = liveData.gate;
        if (newGate && newGate !== storedGate) {
          const termText = liveData.terminal ? `, Terminal ${liveData.terminal}` : '';
          await sendPush(
            fcmToken,
            `⚠️ Gate Change — ${flightIata}`,
            `Now departing from Gate ${newGate}${termText}. Update your plans!`,
            { screen: 'FlightTimeline', flightIata },
          );
          updates['dep.gate']     = newGate;
          if (liveData.terminal) { updates['dep.terminal'] = liveData.terminal; }
          functions.logger.info(`Gate change ${flightIata}: ${storedGate} → ${newGate}`);
        }

        // ── Boarding alert ─────────────────────────────────────────────────────
        const alreadyNotifiedBoarding = flight.notifiedBoarding ?? false;
        if (
          !alreadyNotifiedBoarding &&
          (liveData.status === 'active' || liveData.status === 'boarding')
        ) {
          const gateText = liveData.gate ? ` Gate ${liveData.gate}` : '';
          await sendPush(
            fcmToken,
            `🛫 Boarding now — ${flightIata}`,
            `Head to${gateText} immediately. Boarding has started!`,
            { screen: 'FlightTimeline', flightIata },
          );
          updates['notifiedBoarding'] = true;
        }

        // ── Landing detection ──────────────────────────────────────────────────
        const alreadyNotifiedLanded = flight.notifiedLanded ?? false;
        if (
          !alreadyNotifiedLanded &&
          (liveData.status === 'landed' || liveData.status === 'arrived')
        ) {
          await sendPush(
            fcmToken,
            `✅ ${flightIata} has landed!`,
            'Your flight has landed. Tap to open the Arrival screen.',
            { screen: 'Arrival', flightIata, arrIata: flight.arr?.iata ?? '' },
          );
          updates['notifiedLanded'] = true;
          updates['status']         = 'landed';
        }

        // ── Write updates back to Firestore ────────────────────────────────────
        if (Object.keys(updates).length > 0) {
          await flightDoc.ref.update(updates);
        }
      }
    }

    return null;
  });

/**
 * HTTP trigger for manual testing / on-demand poll for a single user.
 * Call: POST /manualPollFlights with body { uid: "..." }
 */
exports.manualPollFlights = functions.https.onCall(async (data, context) => {
  const uid = data.uid ?? context.auth?.uid;
  if (!uid) { throw new functions.https.HttpsError('unauthenticated', 'uid required'); }

  const userDoc  = await db.collection('users').doc(uid).get();
  const fcmToken = userDoc.data()?.fcmToken;
  if (!fcmToken) {
    return { ok: false, reason: 'No FCM token for this user' };
  }

  const flightsSnap = await db.collection('users').doc(uid).collection('flights').get();
  const results = [];

  for (const flightDoc of flightsSnap.docs) {
    const flight     = flightDoc.data();
    const flightIata = flight.flightIata;
    const liveData   = await fetchLiveStatus(flightIata);
    results.push({ flightIata, liveData });
  }

  return { ok: true, checked: results.length, results };
});
