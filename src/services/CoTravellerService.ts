/**
 * CoTravellerService — Let family track your flight live
 *
 * Free:    6-digit code. Family enters it in their ReadyToFly app to track.
 * Premium: WhatsApp share link (opens app or readytofly.in/track?code=XXXXXX)
 *
 * Firestore: cotravel_codes/{code} { uid, flightIata, depIata, arrIata, createdAt, expiresAt }
 */
import firestore from '@react-native-firebase/firestore';
import { Linking } from 'react-native';

const COTRAVEL_COLLECTION = 'cotravel_codes';
const CODE_EXPIRY_HOURS = 48;

export interface CoTravelCode {
  code: string;
  uid: string;
  flightIata: string;
  depIata: string;
  arrIata: string;
  createdAt: number;
  expiresAt: number;
}

/** Generate a random 6-digit alphanumeric code */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Create or refresh a tracking code for a flight */
export async function createCoTravelCode(params: {
  uid: string;
  flightIata: string;
  depIata: string;
  arrIata: string;
}): Promise<CoTravelCode | null> {
  try {
    // Check if user already has an active code for this flight
    const existing = await firestore()
      .collection(COTRAVEL_COLLECTION)
      .where('uid', '==', params.uid)
      .where('flightIata', '==', params.flightIata)
      .where('expiresAt', '>', Date.now())
      .limit(1)
      .get();

    if (!existing.empty) {
      const data = existing.docs[0].data();
      return {
        code:       existing.docs[0].id,
        uid:        data.uid,
        flightIata: data.flightIata,
        depIata:    data.depIata,
        arrIata:    data.arrIata,
        createdAt:  data.createdAt,
        expiresAt:  data.expiresAt,
      };
    }

    // Generate new unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const taken = await firestore().collection(COTRAVEL_COLLECTION).doc(code).get();
      if (!taken.exists()) { break; }
      code = generateCode();
      attempts++;
    }

    const now = Date.now();
    const expiresAt = now + CODE_EXPIRY_HOURS * 60 * 60 * 1000;

    await firestore().collection(COTRAVEL_COLLECTION).doc(code).set({
      uid:        params.uid,
      flightIata: params.flightIata,
      depIata:    params.depIata,
      arrIata:    params.arrIata,
      createdAt:  now,
      expiresAt,
    });

    return { code, ...params, createdAt: now, expiresAt };
  } catch {
    return null;
  }
}

/** Look up a tracking code — returns flight info or null if invalid/expired */
export async function lookupCoTravelCode(code: string): Promise<CoTravelCode | null> {
  try {
    const doc = await firestore().collection(COTRAVEL_COLLECTION).doc(code.toUpperCase()).get();
    if (!doc.exists()) { return null; }
    const data = doc.data()!;
    if (data.expiresAt < Date.now()) { return null; } // expired
    return { code: doc.id, ...data } as CoTravelCode;
  } catch {
    return null;
  }
}

/** Get the share URL for premium users */
export function getShareUrl(code: string): string {
  return `https://readytofly.in/track?code=${code}`;
}

/** Open WhatsApp share with tracking link (premium) */
export async function shareViaWhatsApp(code: string, flightIata: string, depIata: string, arrIata: string): Promise<void> {
  const url = getShareUrl(code);
  const message = `Track my flight ${flightIata} (${depIata}→${arrIata}) live on ReadyToFly!\n\nOpen this link: ${url}\n\nOr enter code: ${code} in the ReadyToFly app.`;
  const waUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
  const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(waUrl);
  Linking.openURL(canOpen ? waUrl : webUrl);
}

/** Delete a code (e.g. when flight is done) */
export async function deleteCoTravelCode(code: string): Promise<void> {
  try {
    await firestore().collection(COTRAVEL_COLLECTION).doc(code).delete();
  } catch {}
}
