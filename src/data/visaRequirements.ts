/**
 * Visa requirements for Indian passport holders.
 * Status as of 2025. Always verify with official embassy / IATA Travel Centre.
 *
 * status:
 *  'free'   — No visa required (visa-free)
 *  'voa'    — Visa on arrival
 *  'evisa'  — e-Visa available online before travel
 *  'req'    — Visa required (must apply at consulate)
 */

export type VisaStatus = 'free' | 'voa' | 'evisa' | 'req';

export type VisaEntry = {
  country: string;
  flag: string;
  status: VisaStatus;
  duration?: string;    // max stay
  notes: string;
  applyUrl?: string;    // official portal
  iatas: string[];      // airports in this country from our airports.ts
};

const STATUS_LABEL: Record<VisaStatus, string> = {
  free:  'Visa Free ✅',
  voa:   'Visa on Arrival 🟡',
  evisa: 'e-Visa 🔵',
  req:   'Visa Required 🔴',
};

export { STATUS_LABEL };

export const VISA_REQUIREMENTS: VisaEntry[] = [
  // ── Visa Free ────────────────────────────────────────────────────────────
  {
    country: 'Nepal', flag: '🇳🇵', status: 'free',
    duration: 'No limit (Indians)',
    notes: 'Indian nationals do not need a passport — Voter ID or Aadhaar accepted at Kathmandu.',
    iatas: ['KTM'],
  },
  {
    country: 'Bhutan', flag: '🇧🇹', status: 'free',
    duration: 'No limit (Indians)',
    notes: 'Indians enter free. Sustainable Development Fee (SDF) of USD 100/day applies from 2024.',
    iatas: ['PBH'],
  },
  {
    country: 'Mauritius', flag: '🇲🇺', status: 'free',
    duration: '60 days',
    notes: 'No visa required. Return ticket & sufficient funds may be checked at immigration.',
    iatas: ['MRU', 'RRG'],
  },
  {
    country: 'Seychelles', flag: '🇸🇨', status: 'free',
    duration: '30 days',
    notes: 'Visitor\'s Permit issued on arrival. Proof of accommodation required.',
    iatas: ['SEZ'],
  },
  {
    country: 'Jamaica', flag: '🇯🇲', status: 'free',
    duration: '30 days',
    notes: 'No visa required for Indians.',
    iatas: [],
  },
  {
    country: 'Fiji', flag: '🇫🇯', status: 'free',
    duration: '4 months',
    notes: 'No visa required for Indian passport holders.',
    iatas: [],
  },

  // ── Visa on Arrival ───────────────────────────────────────────────────────
  {
    country: 'Thailand', flag: '🇹🇭', status: 'voa',
    duration: '30 days',
    notes: 'Visa on Arrival at BKK, DMK, HKT and other international airports. Fee THB 2,000 (~₹4,500). Bring passport photo.',
    applyUrl: 'https://www.suvarnabhumiairport.com/en/passengerinformation/arrivals/visa-on-arrival',
    iatas: ['BKK', 'DMK', 'HKT'],
  },
  {
    country: 'Cambodia', flag: '🇰🇭', status: 'voa',
    duration: '30 days',
    notes: 'USD 30 on arrival. e-Visa also available at evisa.gov.kh for USD 36.',
    applyUrl: 'https://www.evisa.gov.kh',
    iatas: ['REP'],
  },
  {
    country: 'Maldives', flag: '🇲🇻', status: 'voa',
    duration: '30 days',
    notes: 'Free 30-day tourist visa on arrival. No fee.',
    iatas: ['MLE'],
  },
  {
    country: 'Indonesia', flag: '🇮🇩', status: 'voa',
    duration: '30 days',
    notes: 'Social/Tourist Visa on Arrival at 22 airports incl. CGK & DPS. IDR 500,000 (~₹2,500). Extendable once.',
    iatas: ['CGK', 'DPS'],
  },
  {
    country: 'Malaysia', flag: '🇲🇾', status: 'voa',
    duration: '30 days',
    notes: 'eNTRI or Visa on Arrival. MDAC pre-approval (free, 72 hrs before travel) recommended.',
    applyUrl: 'https://apply.evisa.gov.my',
    iatas: ['KUL'],
  },
  {
    country: 'Sri Lanka', flag: '🇱🇰', status: 'evisa',
    duration: '30 days',
    notes: 'Electronic Travel Authorisation (ETA) online — USD 20 for tourism. Also available on arrival (USD 35).',
    applyUrl: 'https://www.eta.gov.lk',
    iatas: ['CMB'],
  },

  // ── e-Visa ────────────────────────────────────────────────────────────────
  {
    country: 'Turkey', flag: '🇹🇷', status: 'evisa',
    duration: '30 days',
    notes: 'e-Visa mandatory before travel. Apply at evisa.gov.tr. USD 40–55 depending on duration.',
    applyUrl: 'https://www.evisa.gov.tr',
    iatas: ['IST', 'SAW'],
  },
  {
    country: 'Egypt', flag: '🇪🇬', status: 'evisa',
    duration: '30 days',
    notes: 'e-Visa available at visa2egypt.gov.eg. USD 25. Also available at Cairo airport.',
    applyUrl: 'https://visa2egypt.gov.eg',
    iatas: ['CAI'],
  },
  {
    country: 'Kenya', flag: '🇰🇪', status: 'evisa',
    duration: '90 days',
    notes: 'East Africa Tourist Visa (Kenya, Uganda, Rwanda combined) — USD 100 at evisa.go.ke.',
    applyUrl: 'https://evisa.go.ke',
    iatas: ['NBO'],
  },
  {
    country: 'Myanmar', flag: '🇲🇲', status: 'evisa',
    duration: '28 days',
    notes: 'e-Visa at evisa.moip.gov.mm. USD 50. Apply 3 business days in advance.',
    applyUrl: 'https://evisa.moip.gov.mm',
    iatas: ['RGN'],
  },
  {
    country: 'Singapore', flag: '🇸🇬', status: 'evisa',
    duration: '30 days',
    notes: 'STVP (Short-Term Visit Pass) required — apply via SG embassy or ICA. Free but takes 3–5 days.',
    applyUrl: 'https://eservices.ica.gov.sg/esvclandingpage/VAPP',
    iatas: ['SIN'],
  },
  {
    country: 'Ethiopia', flag: '🇪🇹', status: 'evisa',
    duration: '30 days',
    notes: 'e-Visa at evisa.gov.et. USD 52 for 30-day single entry.',
    applyUrl: 'https://www.evisa.gov.et',
    iatas: ['ADD'],
  },
  {
    country: 'Philippines', flag: '🇵🇭', status: 'evisa',
    duration: '30 days',
    notes: 'eTravel registration required (free) at etravel.gov.ph. No visa needed for stays under 30 days.',
    applyUrl: 'https://etravel.gov.ph',
    iatas: ['MNL'],
  },
  {
    country: 'Bangladesh', flag: '🇧🇩', status: 'evisa',
    duration: '30 days',
    notes: 'e-Visa for most Indian nationals via ivac.com.bd. Bangladeshis in India can also apply. BDT 2,400.',
    applyUrl: 'https://www.ivac.com.bd',
    iatas: ['DAC', 'CGP'],
  },

  // ── Visa Required (common destinations) ──────────────────────────────────
  {
    country: 'UAE', flag: '🇦🇪', status: 'req',
    duration: '30 or 90 days',
    notes: 'Visa required — apply online via airlines (Emirates, Flydubai) or travel.state.ae. 30-day tourist visa ~AED 250 (~₹5,600). Many agents process quickly.',
    applyUrl: 'https://smartservices.icp.gov.ae/echannels/web/client/default.html#/login',
    iatas: ['DXB', 'AUH', 'SHJ', 'DWC'],
  },
  {
    country: 'Qatar', flag: '🇶🇦', status: 'req',
    duration: '30 days',
    notes: 'Visa required — apply via Qatar tourism portal or through Qatar Airways. Free 96-hr transit visa available.',
    applyUrl: 'https://www.visitqatar.com/en/plan-your-trip/visas',
    iatas: ['DOH'],
  },
  {
    country: 'Saudi Arabia', flag: '🇸🇦', status: 'req',
    duration: '90 days',
    notes: 'e-Visa for tourists at visa.visitsaudi.com (SAR 300, ~₹6,700). Umrah visa through registered agents. Work visa through employer.',
    applyUrl: 'https://visa.visitsaudi.com',
    iatas: ['RUH', 'JED', 'MED', 'DMM'],
  },
  {
    country: 'Kuwait', flag: '🇰🇼', status: 'req',
    duration: '90 days',
    notes: 'e-Visa for Indians at e.moi.gov.kw. USD 30.',
    applyUrl: 'https://evisa.moi.gov.kw',
    iatas: ['KWI'],
  },
  {
    country: 'Oman', flag: '🇴🇲', status: 'req',
    duration: '30 days',
    notes: 'e-Visa at evisa.rop.gov.om. OMR 20 (~₹4,500). Processed within 24 hours.',
    applyUrl: 'https://evisa.rop.gov.om',
    iatas: ['MCT', 'SLL'],
  },
  {
    country: 'Bahrain', flag: '🇧🇭', status: 'req',
    duration: '14 days',
    notes: 'e-Visa at evisa.gov.bh. BHD 9 (~₹2,000) for 2-week visit. Also available on arrival.',
    applyUrl: 'https://www.evisa.gov.bh',
    iatas: ['BAH'],
  },
  {
    country: 'UK', flag: '🇬🇧', status: 'req',
    duration: '6 months',
    notes: 'Standard Visitor Visa via gov.uk. ~GBP 115 (~₹12,000). Apply 3 months in advance. Biometrics at VFS. Processing 3–8 weeks.',
    applyUrl: 'https://www.gov.uk/apply-uk-visa',
    iatas: ['LHR', 'LGW', 'MAN', 'BHX', 'STN'],
  },
  {
    country: 'France', flag: '🇫🇷', status: 'req',
    duration: '90 days (Schengen)',
    notes: 'Schengen Visa via French embassy / VFS. EUR 80. Valid for 26 Schengen countries. Apply 6 weeks in advance.',
    applyUrl: 'https://vfsglobal.com/france/india',
    iatas: ['CDG', 'ORY'],
  },
  {
    country: 'Germany', flag: '🇩🇪', status: 'req',
    duration: '90 days (Schengen)',
    notes: 'Schengen Visa via German embassy / VFS. EUR 80.',
    applyUrl: 'https://vfsglobal.com/Germany/India',
    iatas: ['FRA', 'MUC'],
  },
  {
    country: 'Netherlands', flag: '🇳🇱', status: 'req',
    duration: '90 days (Schengen)',
    notes: 'Schengen Visa via Netherlands embassy / VFS. EUR 80.',
    applyUrl: 'https://vfsglobal.com/Netherlands/India',
    iatas: ['AMS'],
  },
  {
    country: 'Switzerland', flag: '🇨🇭', status: 'req',
    duration: '90 days (Schengen)',
    notes: 'Swiss consulate or TLScontact. CHF 80.',
    applyUrl: 'https://www.tlscontact.com/in/CH',
    iatas: ['ZRH', 'GVA'],
  },
  {
    country: 'Italy', flag: '🇮🇹', status: 'req',
    duration: '90 days (Schengen)',
    notes: 'Schengen Visa via Italian embassy / VFS. EUR 80.',
    applyUrl: 'https://vfsglobal.com/Italy/India',
    iatas: ['FCO', 'MXP'],
  },
  {
    country: 'Spain', flag: '🇪🇸', status: 'req',
    duration: '90 days (Schengen)',
    notes: 'Schengen Visa via Spanish consulate / TLScontact.',
    applyUrl: 'https://www.tlscontact.com/in/ES',
    iatas: ['BCN', 'MAD'],
  },
  {
    country: 'USA', flag: '🇺🇸', status: 'req',
    duration: '10 years (B1/B2)',
    notes: 'B1/B2 Tourist/Business Visa via ceac.state.gov. USD 160. DS-160 form + interview at consulate. Wait times vary widely — book early.',
    applyUrl: 'https://ceac.state.gov/genniv',
    iatas: ['JFK', 'EWR', 'ORD', 'LAX', 'SFO', 'IAD', 'IAH', 'ATL', 'BOS', 'SEA', 'DFW'],
  },
  {
    country: 'Canada', flag: '🇨🇦', status: 'req',
    duration: '6 months',
    notes: 'Visitor Visa (TRV) via ircc.canada.ca. CAD 100. Biometrics CAD 85 extra. Processing can take 6–12 weeks.',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
    iatas: ['YYZ', 'YVR'],
  },
  {
    country: 'Australia', flag: '🇦🇺', status: 'req',
    duration: '3–12 months',
    notes: 'Visitor Visa (subclass 600) via immi.homeaffairs.gov.au. AUD 150. Processing 2–8 weeks. eVisitor NOT available to Indians.',
    applyUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600',
    iatas: ['SYD', 'MEL', 'BNE', 'PER'],
  },
  {
    country: 'New Zealand', flag: '🇳🇿', status: 'req',
    duration: '9 months',
    notes: 'Visitor Visa (INZ 1017) via immigration.govt.nz. NZD 211. Processing 20–50 days.',
    applyUrl: 'https://www.immigration.govt.nz',
    iatas: ['AKL'],
  },
  {
    country: 'Japan', flag: '🇯🇵', status: 'req',
    duration: '15 or 90 days',
    notes: 'Visa required — apply at VFS Japan centres. Free of charge but requires itinerary. 15-day single entry or 90-day multiple entry.',
    applyUrl: 'https://vfsglobal.com/Japan/India',
    iatas: ['NRT', 'HND'],
  },
  {
    country: 'South Korea', flag: '🇰🇷', status: 'req',
    duration: '60 days',
    notes: 'Tourist visa via e-Visa portal (evisa.mofa.go.kr). USD 45. Processing 3–7 days.',
    applyUrl: 'https://evisa.mofa.go.kr',
    iatas: ['ICN'],
  },
  {
    country: 'China', flag: '🇨🇳', status: 'req',
    duration: '30 days',
    notes: 'Visa required via Chinese embassy / VFS. CNY fee. Note: Indian passport holders face additional scrutiny. Apply well in advance.',
    applyUrl: 'https://vfsglobal.cn',
    iatas: ['PEK', 'PKX', 'PVG', 'CAN'],
  },
  {
    country: 'Hong Kong', flag: '🇭🇰', status: 'free',
    duration: '14 days',
    notes: 'Indians can enter Hong Kong without a visa for up to 14 days for tourism.',
    iatas: ['HKG'],
  },
  {
    country: 'Israel', flag: '🇮🇱', status: 'free',
    duration: '90 days',
    notes: 'No visa required for Indians since 2023. Ensure no Pakistani/Bangladeshi entry stamps in passport.',
    iatas: ['TLV'],
  },
  {
    country: 'South Africa', flag: '🇿🇦', status: 'req',
    duration: '30 days',
    notes: 'Visa required via VFS South Africa. ZAR 425. Yellow fever certificate required if transiting endemic countries.',
    applyUrl: 'https://vfsglobal.com/southafrica/india',
    iatas: ['JNB', 'CPT'],
  },
];
