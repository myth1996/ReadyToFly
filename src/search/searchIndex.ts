/**
 * FlyEasy Search Index
 * Central list of all searchable items in the app.
 * Each item maps to a screen/action via navigateTo.
 */

export type SearchCategory = 'Quick Actions' | 'Tools' | 'Information' | 'Account';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  icon: string;
  category: SearchCategory;
  navigateTo:
    | { type: 'stack'; screen: string }
    | { type: 'tab'; tab: string }
    | { type: 'tab-then-stack'; tab: string; screen: string };
}

export const SEARCH_INDEX: SearchItem[] = [
  // ─── Quick Actions ─────────────────────────────────────────────────────────
  {
    id: 'add-flight',
    title: 'Add Flight',
    description: 'Track a new flight by number or PNR',
    keywords: ['add', 'new', 'flight', 'track', 'pnr', 'booking', 'indigo', 'air india', 'spicejet', 'akasa', 'vistara', 'go first', 'number', 'code', 'register', 'enter'],
    icon: '✈️',
    category: 'Quick Actions',
    navigateTo: { type: 'stack', screen: 'AddFlight' },
  },
  {
    id: 'my-flights',
    title: 'My Flights',
    description: 'View all your upcoming and past flights',
    keywords: ['my flights', 'upcoming', 'trip', 'trips', 'flights', 'list', 'scheduled', 'itinerary', 'past', 'history', 'all flights'],
    icon: '📋',
    category: 'Quick Actions',
    navigateTo: { type: 'tab', tab: 'My Flights' },
  },
  {
    id: 'trip-dashboard',
    title: 'Trip Dashboard',
    description: 'Your next flight countdown and overview',
    keywords: ['home', 'dashboard', 'next flight', 'countdown', 'overview', 'main', 'trip', 'board'],
    icon: '🏠',
    category: 'Quick Actions',
    navigateTo: { type: 'tab', tab: 'Home' },
  },
  {
    id: 'leave-by',
    title: 'Leave-By Calculator',
    description: 'Calculate when you need to leave for the airport',
    keywords: ['leave', 'depart', 'home', 'when', 'time', 'calculator', 'travel time', 'commute', 'airport', 'timing', 'how early', 'departure time', 'reach airport', 'check-in time', 'leave by'],
    icon: '🕐',
    category: 'Quick Actions',
    navigateTo: { type: 'stack', screen: 'LeaveBy' },
  },

  // ─── Tools ─────────────────────────────────────────────────────────────────
  {
    id: 'calm-mode',
    title: 'Calm Mode',
    description: 'Breathing exercises to calm flight anxiety',
    keywords: ['calm', 'relax', 'breathe', 'breathing', 'anxious', 'anxiety', 'fear', 'nervous', 'meditation', 'stress', 'panic', 'scared', 'flying fear', 'aerophobia', 'exercise', '4-7-8', 'mindfulness', 'peace'],
    icon: '😌',
    category: 'Tools',
    navigateTo: { type: 'stack', screen: 'CalmMode' },
  },
  {
    id: 'doc-checklist',
    title: 'Document Checklist',
    description: 'Checklist of documents needed for your flight',
    keywords: ['document', 'documents', 'checklist', 'passport', 'id', 'ticket', 'boarding', 'visa', 'aadhaar', 'pan', 'id proof', 'ticket print', 'required', 'carry', 'dont forget', 'packing', 'identity'],
    icon: '📋',
    category: 'Tools',
    navigateTo: { type: 'stack', screen: 'DocChecklist' },
  },
  {
    id: 'baggage-rules',
    title: 'Baggage Rules',
    description: 'Airline baggage allowance and weight limits',
    keywords: ['baggage', 'luggage', 'bag', 'weight', 'limit', 'cabin', 'check-in', 'checked', 'allowance', 'kg', 'kilos', 'overweight', 'excess', 'suitcase', 'trolley', 'carry-on', 'hand baggage', '7kg', '15kg', '20kg', '23kg', 'free baggage', 'indigo baggage', 'air india baggage'],
    icon: '🧳',
    category: 'Tools',
    navigateTo: { type: 'stack', screen: 'BaggageRules' },
  },
  {
    id: 'frequent-flyer',
    title: 'Frequent Flyer',
    description: 'Manage your frequent flyer miles and programmes',
    keywords: ['frequent flyer', 'miles', 'points', 'reward', 'loyalty', 'programme', 'program', 'club', 'membership', 'earn', 'redeem', 'gold', 'silver', 'platinum', 'tier', 'air india maharaja', 'spiceroute', 'club vistara', 'indigo 6e rewards'],
    icon: '🏅',
    category: 'Tools',
    navigateTo: { type: 'stack', screen: 'FrequentFlyer' },
  },
  {
    id: 'alerts',
    title: 'Flight Alerts',
    description: 'Set notifications for gate changes, delays, boarding',
    keywords: ['alert', 'alerts', 'notification', 'notify', 'reminder', 'gate change', 'delay', 'boarding', 'push', 'bell', 'status update', 'on time', 'cancelled', 'flight status alert'],
    icon: '🔔',
    category: 'Tools',
    navigateTo: { type: 'tab', tab: 'Alerts' },
  },

  // ─── Information ───────────────────────────────────────────────────────────
  {
    id: 'airport-guide',
    title: 'Airport Guide',
    description: 'Terminal maps, lounges, food, and facilities',
    keywords: ['airport', 'guide', 'terminal', 'map', 'lounge', 'food', 'parking', 'facilities', 'wifi', 'atm', 'gate', 'check-in counter', 'security', 'immigration', 'customs', 'departure', 'arrival', 'del', 'bom', 'maa', 'ccu', 'blr', 'hyd', 'cok', 'jai'],
    icon: '🗺️',
    category: 'Information',
    navigateTo: { type: 'tab', tab: 'Airport Guide' },
  },
  {
    id: 'visa',
    title: 'Visa Requirements',
    description: 'Visa information for international travel',
    keywords: ['visa', 'visaa', 'travel', 'international', 'abroad', 'foreign', 'country', 'passport', 'requirement', 'apply', 'application', 'tourist', 'tourist visa', 'business visa', 'on arrival', 'visa free', 'usa', 'uk', 'europe', 'schengen', 'uae', 'dubai', 'singapore', 'australia'],
    icon: '🌍',
    category: 'Information',
    navigateTo: { type: 'stack', screen: 'Visa' },
  },

  // ─── Account ───────────────────────────────────────────────────────────────
  {
    id: 'premium',
    title: 'Upgrade to Premium',
    description: 'Unlock all features — ad-free, Calm Mode, and more',
    keywords: ['premium', 'upgrade', 'subscribe', 'subscription', 'pro', 'unlock', 'ad free', 'ads', 'paid', 'plan', 'annual', 'monthly', 'lifetime', 'rupees', 'rs 99', 'rs 499', 'buy', 'purchase', 'crown', 'gold'],
    icon: '👑',
    category: 'Account',
    navigateTo: { type: 'stack', screen: 'Premium' },
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How FlyEasy handles your data',
    keywords: ['privacy', 'policy', 'data', 'gdpr', 'personal information', 'secure', 'security', 'terms', 'legal', 'protection'],
    icon: '🔒',
    category: 'Account',
    navigateTo: { type: 'stack', screen: 'PrivacyPolicy' },
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'FlyEasy terms and conditions',
    keywords: ['terms', 'conditions', 'service', 'tos', 'agreement', 'legal', 'policy'],
    icon: '📄',
    category: 'Account',
    navigateTo: { type: 'stack', screen: 'TermsOfService' },
  },
];

/** Items grouped by category (used for Phase 1 suggestions) */
export const SEARCH_BY_CATEGORY: Record<SearchCategory, SearchItem[]> = {
  'Quick Actions': SEARCH_INDEX.filter(i => i.category === 'Quick Actions'),
  'Tools':         SEARCH_INDEX.filter(i => i.category === 'Tools'),
  'Information':   SEARCH_INDEX.filter(i => i.category === 'Information'),
  'Account':       SEARCH_INDEX.filter(i => i.category === 'Account'),
};

export const CATEGORY_ORDER: SearchCategory[] = [
  'Quick Actions',
  'Tools',
  'Information',
  'Account',
];
