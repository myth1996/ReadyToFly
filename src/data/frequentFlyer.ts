/** Frequent Flyer programme definitions for Indian carriers + top international */

export type FFPTier = {
  name: string;
  minPoints?: number;
  minFlights?: number;
  perks: string[];
};

export type FFProgramme = {
  airline: string;
  iataPrefix: string;
  programName: string;
  emoji: string;
  color: string;
  enrollUrl: string;
  tiers: FFPTier[];
};

export const FF_PROGRAMMES: FFProgramme[] = [
  {
    airline: 'IndiGo',
    iataPrefix: '6E',
    programName: 'IndiGo BluChip',
    emoji: '💙',
    color: '#1A56A6',
    enrollUrl: 'https://www.goindigo.in/bluchip.html',
    tiers: [
      {
        name: 'Blue',
        perks: ['Points on every IndiGo flight', 'Redeem for seat upgrades & baggage'],
      },
      {
        name: 'Silver',
        minPoints: 15000,
        perks: ['Priority check-in', 'Complimentary seat selection', 'Lounge access'],
      },
      {
        name: 'Gold',
        minPoints: 40000,
        perks: ['Priority boarding', 'Extra baggage allowance', 'Gold lounge access', 'Dedicated helpline'],
      },
    ],
  },
  {
    airline: 'Air India',
    iataPrefix: 'AI',
    programName: 'Flying Returns',
    emoji: '🔴',
    color: '#C8102E',
    enrollUrl: 'https://www.airindia.com/flying-returns.htm',
    tiers: [
      {
        name: 'Silver',
        minFlights: 20,
        perks: ['Bonus miles on Air India flights', 'Priority check-in', 'Extra baggage 5 kg'],
      },
      {
        name: 'Gold',
        minFlights: 40,
        perks: ['Lounge access (Star Alliance)', 'Business class upgrade waitlist', 'Extra baggage 10 kg', 'Dedicated helpline'],
      },
      {
        name: 'Maharaja',
        minFlights: 80,
        perks: ['Guaranteed lounge access globally', 'Confirmed upgrades', 'Extra baggage 15 kg', 'Personal travel advisor'],
      },
    ],
  },
  {
    airline: 'Vistara',
    iataPrefix: 'UK',
    programName: 'Club Vistara',
    emoji: '🟣',
    color: '#6B2D8B',
    enrollUrl: 'https://www.airvistara.com/in/en/tata-sia-airlines/club-vistara',
    tiers: [
      {
        name: 'Silver',
        minPoints: 4000,
        perks: ['CV Points on every flight', 'Priority check-in', 'Complimentary seat selection'],
      },
      {
        name: 'Gold',
        minPoints: 10000,
        perks: ['Lounge access (Star Alliance)', 'Complimentary upgrade requests', 'Extra baggage 10 kg', 'Fast-track security'],
      },
      {
        name: 'Platinum',
        minPoints: 25000,
        perks: ['Business class lounge globally', 'Confirmed upgrades', 'Dedicated Platinum helpline', 'Welcome gift on board'],
      },
    ],
  },
  {
    airline: 'SpiceJet',
    iataPrefix: 'SG',
    programName: 'SpiceClub',
    emoji: '🟠',
    color: '#E04400',
    enrollUrl: 'https://www.spicejet.com/spiceclub.aspx',
    tiers: [
      {
        name: 'Red',
        perks: ['Earn SpicePoints on flights', 'Redeem for tickets & extras'],
      },
      {
        name: 'Gold',
        minPoints: 5000,
        perks: ['Priority boarding', 'Complimentary snack on select flights', 'Bonus points'],
      },
    ],
  },
  {
    airline: 'Akasa Air',
    iataPrefix: 'QP',
    programName: 'Akasa Club',
    emoji: '🟡',
    color: '#F4A302',
    enrollUrl: 'https://www.akasaair.com/akasa-club',
    tiers: [
      {
        name: 'Member',
        perks: ['Earn points on every Akasa flight', 'Redeem for flight discounts & upgrades'],
      },
      {
        name: 'Silver',
        minPoints: 5000,
        perks: ['Priority boarding', 'Bonus earning multiplier', 'Complimentary seat selection'],
      },
    ],
  },
  {
    airline: 'Emirates',
    iataPrefix: 'EK',
    programName: 'Skywards',
    emoji: '🔵',
    color: '#C69214',
    enrollUrl: 'https://www.emirates.com/skywards/',
    tiers: [
      {
        name: 'Blue',
        perks: ['Miles on every Emirates & flydubai flight', 'Redeem for flights, upgrades & hotel stays'],
      },
      {
        name: 'Silver',
        minPoints: 25000,
        perks: ['Priority check-in', 'Extra baggage 10 kg', 'Bonus miles multiplier'],
      },
      {
        name: 'Gold',
        minPoints: 50000,
        perks: ['Business class lounge access', 'Complimentary upgrades', 'Dedicated check-in counter'],
      },
      {
        name: 'Platinum',
        minPoints: 150000,
        perks: ['A380 first class lounge', 'Guaranteed upgrade', 'Personal travel manager', '2× miles on all flights'],
      },
    ],
  },
  {
    airline: 'Qatar Airways',
    iataPrefix: 'QR',
    programName: 'Privilege Club',
    emoji: '🍷',
    color: '#5C0632',
    enrollUrl: 'https://www.qatarairways.com/privilege-club',
    tiers: [
      {
        name: 'Burgundy',
        perks: ['Avios on every Qatar Airways flight', 'Redeem for Qatar flights & Oneworld partners'],
      },
      {
        name: 'Silver',
        minPoints: 300,
        perks: ['Priority check-in & boarding', 'Extra baggage 10 kg', 'Lounge access on day-of-travel'],
      },
      {
        name: 'Gold',
        minPoints: 700,
        perks: ['Business class lounge (Oneworld)', 'Complimentary upgrades', 'Fast-track security globally'],
      },
      {
        name: 'Platinum',
        minPoints: 1400,
        perks: ['Al Mourjan lounge access', 'Guaranteed upgrades', 'Concierge service', 'Chauffeur drive (select cities)'],
      },
    ],
  },
  {
    airline: 'Singapore Airlines',
    iataPrefix: 'SQ',
    programName: 'KrisFlyer',
    emoji: '🟤',
    color: '#1D3B6F',
    enrollUrl: 'https://www.singaporeair.com/krisflyer',
    tiers: [
      {
        name: 'KrisFlyer',
        perks: ['Miles on SQ, Scoot & Star Alliance', 'Redeem for flights, upgrades & hotels'],
      },
      {
        name: 'Elite Silver',
        minFlights: 15,
        perks: ['Priority boarding', 'Bonus miles 25%', 'SilverKris Lounge (select cities)'],
      },
      {
        name: 'Elite Gold',
        minFlights: 50,
        perks: ['SilverKris Lounge globally', 'Complimentary upgrades', 'Dedicated Elite helpline', '50% bonus miles'],
      },
    ],
  },
];
