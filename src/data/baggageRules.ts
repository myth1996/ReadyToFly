/**
 * Baggage Rules — Indian domestic airlines
 * Data accurate as of early 2026. Always verify with the airline before travel.
 */

export type BaggageRule = {
  airline: string;
  code: string;
  color: string;
  logo: string; // emoji fallback
  cabin: {
    weight: string;
    dimensions: string;
    pieces: string;
    notes: string;
  };
  checkin: {
    economy: string;
    business: string;
    notes: string;
  };
  excessRate: string;
  prohibited: string[];
  special: string;
};

export const baggageRules: BaggageRule[] = [
  {
    airline: 'IndiGo',
    code: '6E',
    color: '#1A0DAB',
    logo: '💙',
    cabin: {
      weight: '7 kg',
      dimensions: '55 × 35 × 25 cm',
      pieces: '1 bag + 1 personal item',
      notes: 'Personal item (laptop bag/handbag) must fit under the seat',
    },
    checkin: {
      economy: '15 kg (standard) / 20 kg, 25 kg, 30 kg (add-on)',
      business: 'N/A (domestic only)',
      notes: 'Excess baggage must be pre-booked online for best rates',
    },
    excessRate: '₹450–₹900 per kg at airport (online: ₹550–₹800 for 5 kg add-on)',
    prohibited: ['Power banks in checked baggage', 'Liquids >100 ml in cabin', 'Sharp objects in cabin', 'Flammable liquids'],
    special: 'Sports equipment allowed with prior booking. Musical instruments can go as cabin bag if within size limits.',
  },
  {
    airline: 'Air India',
    code: 'AI',
    color: '#E31837',
    logo: '❤️',
    cabin: {
      weight: '8 kg',
      dimensions: '55 × 40 × 20 cm',
      pieces: '1 bag + 1 accessory item',
      notes: 'Accessory item: laptop bag, handbag, small backpack',
    },
    checkin: {
      economy: '25 kg (domestic)',
      business: '35 kg (domestic)',
      notes: 'Maharaja Club members get extra 10 kg',
    },
    excessRate: '₹400 per kg at airport',
    prohibited: ['Lithium batteries >100Wh in hold', 'Self-balancing scooters', 'Loose lithium cells'],
    special: 'Unaccompanied minor policy: children 5–11 yrs must book UM service. Air India Express (IX) follows same rules.',
  },
  {
    airline: 'SpiceJet',
    code: 'SG',
    color: '#E8391A',
    logo: '🧡',
    cabin: {
      weight: '7 kg',
      dimensions: '55 × 35 × 25 cm',
      pieces: '1 bag + 1 personal item',
      notes: 'Personal item weight included in 7 kg total',
    },
    checkin: {
      economy: '15 kg (base fare) / up to 30 kg (add-on)',
      business: '30 kg (SpiceMax)',
      notes: 'SpiceMax passengers get priority check-in and boarding',
    },
    excessRate: '₹400 per kg (online pre-book much cheaper)',
    prohibited: ['Dry ice >2.5 kg', 'Firearms without declaration', 'Radioactive materials'],
    special: 'Q400 flights (smaller turboprop) may have stricter size limits. Check aircraft type when booking.',
  },
  {
    airline: 'Vistara',
    code: 'UK',
    color: '#4B0082',
    logo: '💜',
    cabin: {
      weight: '7 kg (Economy) / 10 kg (Business + Premium Economy)',
      dimensions: '55 × 40 × 20 cm',
      pieces: '1 bag + 1 accessory',
      notes: 'Club Vistara Gold/Platinum: additional 5 kg cabin allowance',
    },
    checkin: {
      economy: '15 kg (Economy Lite) / 20 kg (Economy Standard/Flexi)',
      business: '30 kg',
      notes: 'Club Vistara Silver: +5 kg. Gold/Platinum: +10 kg on check-in',
    },
    excessRate: '₹500 per kg at airport',
    prohibited: ['Non-spillable batteries >12V & 100Wh', 'Inflatable life jackets with cylinders'],
    special: 'Musical instruments over cabin size can be booked as a separate seat for ₹1500–₹3000.',
  },
  {
    airline: 'Akasa Air',
    code: 'QP',
    color: '#FF6B00',
    logo: '🟠',
    cabin: {
      weight: '7 kg',
      dimensions: '55 × 40 × 20 cm',
      pieces: '1 bag',
      notes: 'No separate personal item allowance in base fare',
    },
    checkin: {
      economy: '15 kg (base) / 20–30 kg (add-on)',
      business: 'N/A',
      notes: 'AkasaBliss add-on includes 20 kg + priority boarding + extra legroom seat',
    },
    excessRate: '₹500 per kg at airport',
    prohibited: ['Power banks in hold', 'Hoverboards', 'Smart luggage with non-removable batteries'],
    special: 'Most generous delay compensation policy among Indian LCCs. No change fees on some fare types.',
  },
  {
    airline: 'Air India Express',
    code: 'IX',
    color: '#E31837',
    logo: '❤️',
    cabin: {
      weight: '7 kg',
      dimensions: '55 × 40 × 20 cm',
      pieces: '1 bag + 1 personal item',
      notes: 'Personal item max 5 kg (included in 7 kg)',
    },
    checkin: {
      economy: '20 kg (domestic)',
      business: 'N/A',
      notes: 'Express Value fare: 15 kg. Express Flex: 25 kg',
    },
    excessRate: '₹400 per kg',
    prohibited: ['Undeclared firearms', 'Dry ice >2.5 kg'],
    special: 'Merged with AIX Connect (erstwhile Alliance Air). Web check-in opens 48 hours before departure.',
  },
];
