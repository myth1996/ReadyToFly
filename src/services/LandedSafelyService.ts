/**
 * LandedSafelyService — Send landing notifications via WhatsApp / SMS
 *
 * Free users:  wa.me deep link (opens WhatsApp, user taps Send)
 * Premium:     360dialog API (auto-sends in background, no user action)
 * SMS fallback: MSG91 API (premium only)
 *
 * Contacts stored in Firestore: users/{uid}/landedSafelyContacts
 */
import { Linking } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { DIALOG360_API_KEY, MSG91_AUTH_KEY } from '../config/env';
import { AIRPORTS } from '../data/airports';

export interface LandedSafelyContact {
  id?: string;
  name: string;
  phone: string;          // e.g. "9876543210" (without +91)
  channel: 'whatsapp' | 'sms' | 'both';
}

export interface SendResult {
  contactName: string;
  channel: 'whatsapp' | 'sms';
  success: boolean;
  deepLinkOpened?: boolean;
}

const DEFAULT_MESSAGE_TEMPLATE =
  'Hi {contactName}, I have landed safely in {city}. All good! — {senderName}';

function buildMessage(
  template: string,
  contactName: string,
  city: string,
  senderName: string,
): string {
  return template
    .replace('{contactName}', contactName)
    .replace('{city}', city)
    .replace('{senderName}', senderName);
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

export async function saveContacts(
  uid: string,
  contacts: LandedSafelyContact[],
): Promise<void> {
  const ref = firestore()
    .collection('users')
    .doc(uid)
    .collection('landedSafelyContacts');

  // Delete existing, then re-add (simple replace strategy)
  const existing = await ref.get();
  const batch = firestore().batch();
  existing.docs.forEach(doc => batch.delete(doc.ref));
  contacts.forEach(c => batch.set(ref.doc(), c));
  await batch.commit();
}

export async function getContacts(uid: string): Promise<LandedSafelyContact[]> {
  try {
    const snap = await firestore()
      .collection('users')
      .doc(uid)
      .collection('landedSafelyContacts')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as LandedSafelyContact) }));
  } catch {
    return [];
  }
}

export async function saveMessageTemplate(uid: string, template: string): Promise<void> {
  try {
    await firestore().collection('users').doc(uid).update({ landedSafelyTemplate: template });
  } catch {}
}

export async function getMessageTemplate(uid: string): Promise<string> {
  try {
    const doc = await firestore().collection('users').doc(uid).get();
    return doc.data()?.landedSafelyTemplate ?? DEFAULT_MESSAGE_TEMPLATE;
  } catch {
    return DEFAULT_MESSAGE_TEMPLATE;
  }
}

// ─── 360dialog WhatsApp API (premium) ────────────────────────────────────────

async function sendVia360dialog(phone: string, message: string): Promise<boolean> {
  if (DIALOG360_API_KEY === 'YOUR_360DIALOG_KEY_HERE') { return false; }
  try {
    const res = await fetch('https://waba.360dialog.io/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'D360-API-KEY': DIALOG360_API_KEY },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${phone}`,
        type: 'text',
        text: { body: message },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── MSG91 SMS (premium) ─────────────────────────────────────────────────────

async function sendViaMSG91(phone: string, message: string): Promise<boolean> {
  if (MSG91_AUTH_KEY === 'YOUR_MSG91_AUTH_KEY_HERE') { return false; }
  try {
    const res = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        recipients: [{ mobiles: `91${phone}`, message }],
        sender: 'RTOFLY',
        route: '4',
        country: '91',
        sms: [{ message, to: [`91${phone}`] }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── wa.me deep link (free) ───────────────────────────────────────────────────

async function openWhatsAppDeepLink(phone: string, message: string): Promise<boolean> {
  const url = `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(message)}`;
  const webUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    await Linking.openURL(canOpen ? url : webUrl);
    return true;
  } catch {
    return false;
  }
}

// ─── Main send function ───────────────────────────────────────────────────────

export async function sendLandedMessages(params: {
  uid: string | null;
  isPremium: boolean;
  arrIata: string;
  senderName: string;
  contacts: LandedSafelyContact[];
  template?: string;
}): Promise<SendResult[]> {
  const city = AIRPORTS[params.arrIata]?.city ?? params.arrIata;
  const template = params.template ?? DEFAULT_MESSAGE_TEMPLATE;
  const results: SendResult[] = [];

  for (const contact of params.contacts) {
    const message = buildMessage(template, contact.name, city, params.senderName);
    const channels: Array<'whatsapp' | 'sms'> =
      contact.channel === 'both' ? ['whatsapp', 'sms'] : [contact.channel];

    for (const ch of channels) {
      let success = false;
      let deepLinkOpened = false;

      if (ch === 'whatsapp') {
        if (params.isPremium) {
          // Try 360dialog API first, fall back to deep link
          success = await sendVia360dialog(contact.phone, message);
          if (!success) {
            success = await openWhatsAppDeepLink(contact.phone, message);
            deepLinkOpened = success;
          }
        } else {
          // Free users always use deep link
          success = await openWhatsAppDeepLink(contact.phone, message);
          deepLinkOpened = success;
          // Only open one deep link at a time (can't open multiple simultaneously)
          if (success) {
            results.push({ contactName: contact.name, channel: ch, success, deepLinkOpened });
            continue;
          }
        }
      } else {
        // SMS — only attempt if premium (has MSG91 key)
        if (params.isPremium) {
          success = await sendViaMSG91(contact.phone, message);
        }
      }

      results.push({ contactName: contact.name, channel: ch, success, deepLinkOpened });
    }
  }

  return results;
}

export { DEFAULT_MESSAGE_TEMPLATE };
