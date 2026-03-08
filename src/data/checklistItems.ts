/**
 * Document Checklist Data — Domestic & International
 */

export type ChecklistItem = {
  id: string;
  label: string;
  labelHi: string;
  description: string;
  required: boolean;
};

export const domesticChecklist: ChecklistItem[] = [
  {
    id: 'dom-id',
    label: 'Photo ID (Aadhaar / PAN / Voter ID / Driving License)',
    labelHi: 'फोटो पहचान पत्र (आधार / पैन / वोटर आईडी / ड्राइविंग लाइसेंस)',
    description: 'Any government-issued photo ID is accepted for domestic flights.',
    required: true,
  },
  {
    id: 'dom-boarding',
    label: 'Boarding Pass (printed or digital)',
    labelHi: 'बोर्डिंग पास (प्रिंटेड या डिजिटल)',
    description: 'Web check-in and download boarding pass from airline app/website.',
    required: true,
  },
  {
    id: 'dom-pnr',
    label: 'PNR Confirmation / E-ticket',
    labelHi: 'PNR पुष्टि / ई-टिकट',
    description: 'Keep your booking confirmation email or SMS accessible.',
    required: true,
  },
  {
    id: 'dom-webcheckin',
    label: 'Web Check-in Done',
    labelHi: 'वेब चेक-इन पूरा',
    description: 'Check in online 48-2 hours before departure to save time at the airport.',
    required: false,
  },
  {
    id: 'dom-baggage-tag',
    label: 'Baggage Tags (if checked luggage)',
    labelHi: 'बैगेज टैग (यदि चेक-इन सामान है)',
    description: 'Self-print baggage tags at some airports for faster processing.',
    required: false,
  },
  {
    id: 'dom-power-bank',
    label: 'Power Bank in Cabin Only',
    labelHi: 'पावर बैंक केवल केबिन में',
    description: 'Power banks cannot go in checked luggage. Max 20,000 mAh allowed.',
    required: false,
  },
  {
    id: 'dom-covid',
    label: 'Check State COVID/Health Requirements',
    labelHi: 'राज्य COVID/स्वास्थ्य आवश्यकताएं जांचें',
    description: 'Some states may still require health declarations for specific situations.',
    required: false,
  },
];

export const internationalChecklist: ChecklistItem[] = [
  {
    id: 'intl-passport',
    label: 'Passport (validity > 6 months)',
    labelHi: 'पासपोर्ट (वैधता > 6 महीने)',
    description: 'Passport must be valid for at least 6 months from your travel date.',
    required: true,
  },
  {
    id: 'intl-visa',
    label: 'Visa / eVisa / Visa on Arrival confirmation',
    labelHi: 'वीज़ा / ई-वीज़ा / वीज़ा ऑन अराइवल पुष्टि',
    description: 'Ensure your visa type matches your purpose of travel.',
    required: true,
  },
  {
    id: 'intl-boarding',
    label: 'Boarding Pass (printed or digital)',
    labelHi: 'बोर्डिंग पास (प्रिंटेड या डिजिटल)',
    description: 'Some countries require a printed boarding pass at immigration.',
    required: true,
  },
  {
    id: 'intl-pnr',
    label: 'PNR Confirmation / E-ticket',
    labelHi: 'PNR पुष्टि / ई-टिकट',
    description: 'Keep booking confirmation accessible in case immigration asks.',
    required: true,
  },
  {
    id: 'intl-return-ticket',
    label: 'Return Ticket / Onward Travel Proof',
    labelHi: 'वापसी टिकट / आगे की यात्रा का प्रमाण',
    description: 'Many countries require proof of return or onward travel at immigration.',
    required: true,
  },
  {
    id: 'intl-forex',
    label: 'Forex Card / Travel Card / Foreign Currency',
    labelHi: 'फॉरेक्स कार्ड / ट्रैवल कार्ड / विदेशी मुद्रा',
    description: 'Carry a forex card or some local currency of your destination.',
    required: false,
  },
  {
    id: 'intl-insurance',
    label: 'Travel Insurance',
    labelHi: 'यात्रा बीमा',
    description: 'Required for Schengen countries. Strongly recommended for all international travel.',
    required: false,
  },
  {
    id: 'intl-vaccination',
    label: 'Vaccination Certificate (if required)',
    labelHi: 'टीकाकरण प्रमाण पत्र (यदि आवश्यक हो)',
    description: 'Yellow fever certificate required for some African/South American countries.',
    required: false,
  },
  {
    id: 'intl-hotel',
    label: 'Hotel Booking Confirmation',
    labelHi: 'होटल बुकिंग पुष्टि',
    description: 'Immigration may ask for proof of accommodation.',
    required: false,
  },
  {
    id: 'intl-webcheckin',
    label: 'Web Check-in Done',
    labelHi: 'वेब चेक-इन पूरा',
    description: 'Check in online to choose your seat and save time at the airport.',
    required: false,
  },
  {
    id: 'intl-power-bank',
    label: 'Power Bank in Cabin Only (max 20,000 mAh)',
    labelHi: 'पावर बैंक केवल केबिन में (अधिकतम 20,000 mAh)',
    description: 'Lithium batteries and power banks must be in carry-on luggage.',
    required: false,
  },
];
