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
    `checkin-48h-${flightIata}`,
    `checkin-24h-${flightIata}`,
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

// ─── Web Check-In Reminders ────────────────────────────────────────────────────
// Fires at T-48h and T-24h nudging the user to check in online.

export const AIRLINE_CHECKIN_URLS: Record<string, { url: string; appPkg?: string }> = {
  // ── Indian Domestic Carriers ────────────────────────────────────────────────
  indigo:               { url: 'https://www.goindigo.in/check-in.html',                                    appPkg: 'com.go.indigo' },
  '6e':                 { url: 'https://www.goindigo.in/check-in.html',                                    appPkg: 'com.go.indigo' },
  'air india':          { url: 'https://www.airindia.com/in/en/manage/check-in.html',                      appPkg: 'com.airindia.mobile' },
  ai:                   { url: 'https://www.airindia.com/in/en/manage/check-in.html',                      appPkg: 'com.airindia.mobile' },
  'air india express':  { url: 'https://www.airindiaexpress.com/check-in',                                 appPkg: 'com.airindiaexpress.mobile' },
  ix:                   { url: 'https://www.airindiaexpress.com/check-in',                                 appPkg: 'com.airindiaexpress.mobile' },
  spicejet:             { url: 'https://www.spicejet.com/check-in',                                        appPkg: 'com.spicejet.mobile' },
  sg:                   { url: 'https://www.spicejet.com/check-in',                                        appPkg: 'com.spicejet.mobile' },
  akasa:                { url: 'https://www.akasaair.com/check-in',                                        appPkg: 'com.akasaair.mobile' },
  'akasa air':          { url: 'https://www.akasaair.com/check-in',                                        appPkg: 'com.akasaair.mobile' },
  qp:                   { url: 'https://www.akasaair.com/check-in',                                        appPkg: 'com.akasaair.mobile' },
  // Vistara merged with Air India on Nov 12 2024 — UK code now routes to Air India
  vistara:              { url: 'https://www.airindia.com/in/en/manage/check-in.html',                      appPkg: 'com.airindia.mobile' },
  uk:                   { url: 'https://www.airindia.com/in/en/manage/check-in.html',                      appPkg: 'com.airindia.mobile' },
  // AirAsia India rebranded to Air India Express (Nov 2023) — I5 now routes to AIX
  'air asia india':     { url: 'https://www.airindiaexpress.com/check-in',                                 appPkg: 'com.airindiaexpress.mobile' },
  i5:                   { url: 'https://www.airindiaexpress.com/check-in',                                 appPkg: 'com.airindiaexpress.mobile' },
  starair:              { url: 'https://www.starair.in/manage-booking',                                    appPkg: undefined },
  s5:                   { url: 'https://www.starair.in/manage-booking',                                    appPkg: undefined },
  flybig:               { url: 'https://www.flybig.in/manage-booking',                                     appPkg: undefined },
  s9:                   { url: 'https://www.flybig.in/manage-booking',                                     appPkg: undefined },
  fly91:                { url: 'https://www.fly91.com/manage',                                             appPkg: undefined },
  op:                   { url: 'https://www.fly91.com/manage',                                             appPkg: undefined },

  // ── Gulf & Middle East ───────────────────────────────────────────────────────
  emirates:             { url: 'https://www.emirates.com/in/english/manage-booking/check-in/',             appPkg: 'com.emirates.android' },
  ek:                   { url: 'https://www.emirates.com/in/english/manage-booking/check-in/',             appPkg: 'com.emirates.android' },
  'qatar airways':      { url: 'https://www.qatarairways.com/in/en/manage-booking/check-in.html',          appPkg: 'com.qatar.airways' },
  qr:                   { url: 'https://www.qatarairways.com/in/en/manage-booking/check-in.html',          appPkg: 'com.qatar.airways' },
  'etihad airways':     { url: 'https://www.etihad.com/en-in/manage/check-in',                             appPkg: 'com.etihad.etihadairways' },
  ey:                   { url: 'https://www.etihad.com/en-in/manage/check-in',                             appPkg: 'com.etihad.etihadairways' },
  flydubai:             { url: 'https://www.flydubai.com/en/manage/check-in',                              appPkg: 'com.flydubai.mobile' },
  fz:                   { url: 'https://www.flydubai.com/en/manage/check-in',                              appPkg: 'com.flydubai.mobile' },
  'air arabia':         { url: 'https://www.airarabia.com/en/manage-booking',                              appPkg: 'com.airarabia.android' },
  g9:                   { url: 'https://www.airarabia.com/en/manage-booking',                              appPkg: 'com.airarabia.android' },
  '3l':                 { url: 'https://www.airarabia.com/en/manage-booking',                              appPkg: 'com.airarabia.android' },
  'oman air':           { url: 'https://www.omanair.com/en/manage-booking/check-in',                       appPkg: 'com.omanair.mobile' },
  wy:                   { url: 'https://www.omanair.com/en/manage-booking/check-in',                       appPkg: 'com.omanair.mobile' },
  'gulf air':           { url: 'https://www.gulfair.com/manage-booking/online-check-in',                   appPkg: undefined },
  gf:                   { url: 'https://www.gulfair.com/manage-booking/online-check-in',                   appPkg: undefined },
  'kuwait airways':     { url: 'https://www.kuwaitairways.com/en/manage/check-in',                         appPkg: undefined },
  ku:                   { url: 'https://www.kuwaitairways.com/en/manage/check-in',                         appPkg: undefined },
  saudia:               { url: 'https://www.saudia.com/before-you-fly/check-in/web-check-in',              appPkg: 'com.saudia.android' },
  sv:                   { url: 'https://www.saudia.com/before-you-fly/check-in/web-check-in',              appPkg: 'com.saudia.android' },
  flynas:               { url: 'https://www.flynas.com/en/manage-booking/check-in',                        appPkg: 'com.flynas.mobile' },
  xy:                   { url: 'https://www.flynas.com/en/manage-booking/check-in',                        appPkg: 'com.flynas.mobile' },
  'jazeera airways':    { url: 'https://www.jazeeraairways.com/en-in/manage/check-in',                     appPkg: undefined },
  j9:                   { url: 'https://www.jazeeraairways.com/en-in/manage/check-in',                     appPkg: undefined },
  'royal jordanian':    { url: 'https://www.rj.com/en/manage/check-in',                                    appPkg: undefined },
  rj:                   { url: 'https://www.rj.com/en/manage/check-in',                                    appPkg: undefined },
  'middle east airlines': { url: 'https://www.mea.com.lb/english/manage-your-trip/check-in',               appPkg: undefined },
  me:                   { url: 'https://www.mea.com.lb/english/manage-your-trip/check-in',                 appPkg: undefined },
  'wizz air':           { url: 'https://wizzair.com/#/check-in',                                           appPkg: 'hu.wizz.android' },
  '5w':                 { url: 'https://wizzair.com/#/check-in',                                           appPkg: 'hu.wizz.android' },

  // ── European Carriers ───────────────────────────────────────────────────────
  'british airways':    { url: 'https://www.britishairways.com/travel/olcilandingpageauthreq/public/en_in', appPkg: 'com.ba.mobile.android.app' },
  ba:                   { url: 'https://www.britishairways.com/travel/olcilandingpageauthreq/public/en_in', appPkg: 'com.ba.mobile.android.app' },
  lufthansa:            { url: 'https://www.lufthansa.com/in/en/online-check-in',                          appPkg: 'de.lhsystems.android' },
  lh:                   { url: 'https://www.lufthansa.com/in/en/online-check-in',                          appPkg: 'de.lhsystems.android' },
  'air france':         { url: 'https://www.airfrance.in/en/check-in',                                     appPkg: 'com.airfrance.android.dinamoprd' },
  af:                   { url: 'https://www.airfrance.in/en/check-in',                                     appPkg: 'com.airfrance.android.dinamoprd' },
  klm:                  { url: 'https://www.klm.com/en/check-in',                                          appPkg: 'com.klm.mobile.android' },
  kl:                   { url: 'https://www.klm.com/en/check-in',                                          appPkg: 'com.klm.mobile.android' },
  swiss:                { url: 'https://www.swiss.com/in/en/manage/check-in',                              appPkg: 'com.swiss.android' },
  lx:                   { url: 'https://www.swiss.com/in/en/manage/check-in',                              appPkg: 'com.swiss.android' },
  'austrian airlines':  { url: 'https://www.austrian.com/in/en/manage/check-in',                           appPkg: undefined },
  os:                   { url: 'https://www.austrian.com/in/en/manage/check-in',                           appPkg: undefined },
  'turkish airlines':   { url: 'https://www.turkishairlines.com/en-in/flights/manage-booking/check-in/',   appPkg: 'com.thy.android' },
  tk:                   { url: 'https://www.turkishairlines.com/en-in/flights/manage-booking/check-in/',   appPkg: 'com.thy.android' },
  'virgin atlantic':    { url: 'https://www.virginatlantic.com/gb/en/manage-booking/check-in.html',        appPkg: 'com.virginatlantic.android' },
  vs:                   { url: 'https://www.virginatlantic.com/gb/en/manage-booking/check-in.html',        appPkg: 'com.virginatlantic.android' },

  // ── Asian Carriers ──────────────────────────────────────────────────────────
  'singapore airlines': { url: 'https://www.singaporeair.com/en_UK/in/travel-info/check-in/',              appPkg: 'com.singaporeair.android' },
  sq:                   { url: 'https://www.singaporeair.com/en_UK/in/travel-info/check-in/',              appPkg: 'com.singaporeair.android' },
  'malaysia airlines':  { url: 'https://www.malaysiaairlines.com/in/en/manage-booking/check-in.html',      appPkg: 'com.mas.android' },
  mh:                   { url: 'https://www.malaysiaairlines.com/in/en/manage-booking/check-in.html',      appPkg: 'com.mas.android' },
  'thai airways':       { url: 'https://www.thaiairways.com/en_IN/fly-with-us/check-in.page',              appPkg: undefined },
  tg:                   { url: 'https://www.thaiairways.com/en_IN/fly-with-us/check-in.page',              appPkg: undefined },
  'cathay pacific':     { url: 'https://www.cathaypacific.com/cx/en_IN/manage-booking/check-in.html',      appPkg: 'com.cathaypacific.cathaypacific' },
  cx:                   { url: 'https://www.cathaypacific.com/cx/en_IN/manage-booking/check-in.html',      appPkg: 'com.cathaypacific.cathaypacific' },
  'japan airlines':     { url: 'https://www.jal.co.jp/en/inter/service/wci/',                              appPkg: 'jp.co.jal.dom' },
  jl:                   { url: 'https://www.jal.co.jp/en/inter/service/wci/',                              appPkg: 'jp.co.jal.dom' },
  ana:                  { url: 'https://www.ana.co.jp/en/in/travel-information/check-in/',                  appPkg: 'jp.co.ana.android' },
  nh:                   { url: 'https://www.ana.co.jp/en/in/travel-information/check-in/',                  appPkg: 'jp.co.ana.android' },
  'korean air':         { url: 'https://www.koreanair.com/booking/check-in',                               appPkg: 'com.koreanair.android' },
  ke:                   { url: 'https://www.koreanair.com/booking/check-in',                               appPkg: 'com.koreanair.android' },
  'asiana airlines':    { url: 'https://flyasiana.com/C/EN/checkin',                                       appPkg: undefined },
  oz:                   { url: 'https://flyasiana.com/C/EN/checkin',                                       appPkg: undefined },
  scoot:                { url: 'https://www.flyscoot.com/en/manage-booking/check-in',                      appPkg: 'com.scoot.android' },
  tr:                   { url: 'https://www.flyscoot.com/en/manage-booking/check-in',                      appPkg: 'com.scoot.android' },
  'air asia':           { url: 'https://www.airasia.com/check-in/en/gb',                                   appPkg: 'com.airasia.mobile' },
  ak:                   { url: 'https://www.airasia.com/check-in/en/gb',                                   appPkg: 'com.airasia.mobile' },
  'batik air':          { url: 'https://www.batikair.com/en/manage/check-in',                              appPkg: undefined },
  id:                   { url: 'https://www.batikair.com/en/manage/check-in',                              appPkg: undefined },

  // ── South Asian Carriers ────────────────────────────────────────────────────
  srilankan:            { url: 'https://www.srilankan.com/en_uk/fly-with-us/check-in',                     appPkg: 'com.srilankan.app' },
  ul:                   { url: 'https://www.srilankan.com/en_uk/fly-with-us/check-in',                     appPkg: 'com.srilankan.app' },
  'nepal airlines':     { url: 'https://www.nepalairlines.com.np/passenger/check-in',                      appPkg: undefined },
  ra:                   { url: 'https://www.nepalairlines.com.np/passenger/check-in',                      appPkg: undefined },
  'biman bangladesh':   { url: 'https://www.biman-airlines.com/manage/check-in',                           appPkg: undefined },
  bg:                   { url: 'https://www.biman-airlines.com/manage/check-in',                           appPkg: undefined },
  maldivian:            { url: 'https://www.maldivian.aero/manage-booking',                                appPkg: undefined },
  q2:                   { url: 'https://www.maldivian.aero/manage-booking',                                appPkg: undefined },

  // ── African Carriers ────────────────────────────────────────────────────────
  'ethiopian airlines': { url: 'https://www.ethiopianairlines.com/aa/manage-booking/check-in',             appPkg: 'com.ethiopianairlines.android' },
  et:                   { url: 'https://www.ethiopianairlines.com/aa/manage-booking/check-in',             appPkg: 'com.ethiopianairlines.android' },
  'kenya airways':      { url: 'https://www.kenya-airways.com/en/manage/check-in/',                        appPkg: undefined },
  kq:                   { url: 'https://www.kenya-airways.com/en/manage/check-in/',                        appPkg: undefined },
  egyptair:             { url: 'https://www.egyptair.com/en/fly/check-in/Pages/Check-In.aspx',             appPkg: undefined },
  ms:                   { url: 'https://www.egyptair.com/en/fly/check-in/Pages/Check-In.aspx',             appPkg: undefined },
  'air mauritius':      { url: 'https://www.airmauritius.com/en/manage-travel/web-check-in',               appPkg: undefined },
  mk:                   { url: 'https://www.airmauritius.com/en/manage-travel/web-check-in',               appPkg: undefined },

  // ── North American Carriers ─────────────────────────────────────────────────
  'american airlines':  { url: 'https://www.aa.com/checkin/viewCheckinPage.do',                            appPkg: 'com.aa.android' },
  aa:                   { url: 'https://www.aa.com/checkin/viewCheckinPage.do',                            appPkg: 'com.aa.android' },
  'united airlines':    { url: 'https://www.united.com/en/us/checkin',                                     appPkg: 'com.united.mobile.android.na' },
  ua:                   { url: 'https://www.united.com/en/us/checkin',                                     appPkg: 'com.united.mobile.android.na' },
  delta:                { url: 'https://www.delta.com/us/en/check-in/overview',                            appPkg: 'com.delta.mobile.android' },
  dl:                   { url: 'https://www.delta.com/us/en/check-in/overview',                            appPkg: 'com.delta.mobile.android' },
  'air canada':         { url: 'https://www.aircanada.com/in/en/aco/home/manage/check-in.html',            appPkg: 'com.aircanada.android' },
  ac:                   { url: 'https://www.aircanada.com/in/en/aco/home/manage/check-in.html',            appPkg: 'com.aircanada.android' },

  // ── China Carriers ──────────────────────────────────────────────────────────
  'air china':          { url: 'https://www.airchina.com/en/check-in/',                                    appPkg: undefined },
  ca:                   { url: 'https://www.airchina.com/en/check-in/',                                    appPkg: undefined },
  'china eastern':      { url: 'https://global.ceair.com/en/check-in',                                     appPkg: undefined },
  mu:                   { url: 'https://global.ceair.com/en/check-in',                                     appPkg: undefined },
  'china southern':     { url: 'https://www.csair.com/en/tourguide/checkin/',                              appPkg: undefined },
  cz:                   { url: 'https://www.csair.com/en/tourguide/checkin/',                              appPkg: undefined },

  // ── Oceania Carriers ────────────────────────────────────────────────────────
  qantas:               { url: 'https://www.qantas.com/in/en/check-in.html',                               appPkg: 'com.qantas.android' },
  qf:                   { url: 'https://www.qantas.com/in/en/check-in.html',                               appPkg: 'com.qantas.android' },
  'air new zealand':    { url: 'https://www.airnewzealand.co.nz/check-in',                                 appPkg: undefined },
  nz:                   { url: 'https://www.airnewzealand.co.nz/check-in',                                 appPkg: undefined },
};

export function getCheckInInfo(airline: string, flightIata: string): { url: string; appPkg?: string } | null {
  const airlineKey = airline.toLowerCase().trim();
  const iataCode   = flightIata.replace(/[0-9]/g, '').toLowerCase();

  // 1. Exact IATA code match (most reliable — avoids substring collisions like "ai" in "singapore airlines")
  if (AIRLINE_CHECKIN_URLS[iataCode]) { return AIRLINE_CHECKIN_URLS[iataCode]; }

  // 2. Exact airline name match
  if (AIRLINE_CHECKIN_URLS[airlineKey]) { return AIRLINE_CHECKIN_URLS[airlineKey]; }

  // 3. Partial airline name match only for keys longer than 3 chars (avoids 2-letter IATA code false matches)
  for (const [k, v] of Object.entries(AIRLINE_CHECKIN_URLS)) {
    if (k.length > 3 && airlineKey.includes(k)) { return v; }
  }

  return null;
}

async function scheduleCheckInReminders(opts: {
  flightIata: string;
  airline: string;
  departureTime: string;
  depIata: string;
}): Promise<void> {
  const depMs = new Date(opts.departureTime).getTime();
  const info  = getCheckInInfo(opts.airline, opts.flightIata);
  const hint  = info ? ' Open ReadyToFly to check in now.' : '';

  // T-48h
  await scheduleAt({
    id: `checkin-48h-${opts.flightIata}`,
    title: `🎟️ Check in for ${opts.flightIata}`,
    body: `Web check-in is open for your flight from ${opts.depIata}.${hint}`,
    fireDate: new Date(depMs - 48 * 60 * 60 * 1000),
    channel: CHANNEL_REMINDERS,
  });

  // T-24h
  await scheduleAt({
    id: `checkin-24h-${opts.flightIata}`,
    title: `⏰ Last chance to check in — ${opts.flightIata}`,
    body: `Check in now to pick your seat before departure from ${opts.depIata}.${hint}`,
    fireDate: new Date(depMs - 24 * 60 * 60 * 1000),
    channel: CHANNEL_REMINDERS,
  });
}

// ─── Gate Change Notification ──────────────────────────────────────────────────

async function sendGateChangeNotification(
  flightIata: string,
  newGate: string,
  terminal?: string,
): Promise<void> {
  const terminalText = terminal ? `, Terminal ${terminal}` : '';
  await notifee.displayNotification({
    id: `gate-change-${flightIata}-${newGate}`,
    title: `⚠️ Gate Change — ${flightIata}`,
    body: `Your flight now departs from Gate ${newGate}${terminalText}. Update your plans!`,
    android: {
      channelId: CHANNEL_FLIGHT_ALERTS,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
    },
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
  scheduleCheckInReminders,
  schedulePostFlightReEngagement,
  cancelFlightNotifications,
  sendGateChangeNotification,
  cancelAll,
};
