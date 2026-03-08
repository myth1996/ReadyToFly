/**
 * Comprehensive airport name lookup used across the app (Maps links, display, etc.)
 *
 * Coverage:
 *  • All Indian airports with scheduled commercial services (~85 airports)
 *  • Top 55+ international destinations for Indian travellers
 *
 * IATA codes are the authoritative keys.
 */

export type AirportEntry = {
  name: string;
  city: string;
  country: string;
  /** 'IN' = India, 'INT' = International */
  region: 'IN' | 'INT';
};

export const AIRPORTS: Record<string, AirportEntry> = {

  // ─── INDIA — Metro International Hubs ────────────────────────────────────
  DEL: { name: 'Indira Gandhi International Airport',                   city: 'Delhi',         country: 'India', region: 'IN' },
  BOM: { name: 'Chhatrapati Shivaji Maharaj International Airport',     city: 'Mumbai',        country: 'India', region: 'IN' },
  BLR: { name: 'Kempegowda International Airport',                      city: 'Bengaluru',     country: 'India', region: 'IN' },
  MAA: { name: 'Chennai International Airport',                         city: 'Chennai',       country: 'India', region: 'IN' },
  HYD: { name: 'Rajiv Gandhi International Airport',                    city: 'Hyderabad',     country: 'India', region: 'IN' },
  CCU: { name: 'Netaji Subhas Chandra Bose International Airport',      city: 'Kolkata',       country: 'India', region: 'IN' },
  COK: { name: 'Cochin International Airport',                          city: 'Kochi',         country: 'India', region: 'IN' },
  AMD: { name: 'Sardar Vallabhbhai Patel International Airport',        city: 'Ahmedabad',     country: 'India', region: 'IN' },
  GOI: { name: 'Manohar International Airport',                         city: 'Goa',           country: 'India', region: 'IN' },
  TRV: { name: 'Trivandrum International Airport',                      city: 'Thiruvananthapuram', country: 'India', region: 'IN' },
  CCJ: { name: 'Calicut International Airport',                         city: 'Kozhikode',     country: 'India', region: 'IN' },
  CNN: { name: 'Kannur International Airport',                          city: 'Kannur',        country: 'India', region: 'IN' },
  ATQ: { name: 'Sri Guru Ram Dass Jee International Airport',           city: 'Amritsar',      country: 'India', region: 'IN' },
  IXC: { name: 'Chandigarh International Airport',                      city: 'Chandigarh',    country: 'India', region: 'IN' },
  SXR: { name: 'Sheikh ul Alam Airport',                                city: 'Srinagar',      country: 'India', region: 'IN' },

  // ─── INDIA — Tier 2 Domestic International ────────────────────────────────
  PNQ: { name: 'Pune International Airport',                            city: 'Pune',          country: 'India', region: 'IN' },
  JAI: { name: 'Jaipur International Airport',                          city: 'Jaipur',        country: 'India', region: 'IN' },
  LKO: { name: 'Chaudhary Charan Singh International Airport',          city: 'Lucknow',       country: 'India', region: 'IN' },
  NAG: { name: 'Dr Babasaheb Ambedkar International Airport',           city: 'Nagpur',        country: 'India', region: 'IN' },
  VNS: { name: 'Lal Bahadur Shastri Airport',                           city: 'Varanasi',      country: 'India', region: 'IN' },
  PAT: { name: 'Jay Prakash Narayan Airport',                           city: 'Patna',         country: 'India', region: 'IN' },
  IXR: { name: 'Birsa Munda Airport',                                   city: 'Ranchi',        country: 'India', region: 'IN' },
  GAU: { name: 'Lokpriya Gopinath Bordoloi International Airport',      city: 'Guwahati',      country: 'India', region: 'IN' },
  BBI: { name: 'Biju Patnaik International Airport',                    city: 'Bhubaneswar',   country: 'India', region: 'IN' },
  VTZ: { name: 'Visakhapatnam International Airport',                   city: 'Visakhapatnam', country: 'India', region: 'IN' },
  CJB: { name: 'Coimbatore International Airport',                      city: 'Coimbatore',    country: 'India', region: 'IN' },
  TRZ: { name: 'Tiruchirappalli International Airport',                 city: 'Tiruchirappalli', country: 'India', region: 'IN' },
  IXM: { name: 'Madurai Airport',                                       city: 'Madurai',       country: 'India', region: 'IN' },
  IXE: { name: 'Mangaluru International Airport',                       city: 'Mangaluru',     country: 'India', region: 'IN' },
  IXB: { name: 'Bagdogra Airport',                                      city: 'Siliguri',      country: 'India', region: 'IN' },
  BHO: { name: 'Raja Bhoj Airport',                                     city: 'Bhopal',        country: 'India', region: 'IN' },
  IXZ: { name: 'Veer Savarkar International Airport',                   city: 'Port Blair',    country: 'India', region: 'IN' },
  BDQ: { name: 'Vadodara Airport',                                      city: 'Vadodara',      country: 'India', region: 'IN' },
  STV: { name: 'Surat Airport',                                         city: 'Surat',         country: 'India', region: 'IN' },
  RPR: { name: 'Swami Vivekananda Airport',                             city: 'Raipur',        country: 'India', region: 'IN' },
  RJT: { name: 'Rajkot Airport (Hirasar)',                              city: 'Rajkot',        country: 'India', region: 'IN' },
  BHJ: { name: 'Bhuj Airport (Rudra Mata)',                             city: 'Bhuj',          country: 'India', region: 'IN' },
  GAY: { name: 'Gaya Airport',                                          city: 'Gaya',          country: 'India', region: 'IN' },
  IMF: { name: 'Bir Tikendrajit International Airport',                 city: 'Imphal',        country: 'India', region: 'IN' },

  // ─── INDIA — Rajasthan & Central India ───────────────────────────────────
  UDR: { name: 'Maharana Pratap Airport',                               city: 'Udaipur',       country: 'India', region: 'IN' },
  JDH: { name: 'Jodhpur Airport',                                       city: 'Jodhpur',       country: 'India', region: 'IN' },
  JSA: { name: 'Jaisalmer Airport',                                     city: 'Jaisalmer',     country: 'India', region: 'IN' },
  GWL: { name: 'Gwalior Airport',                                       city: 'Gwalior',       country: 'India', region: 'IN' },
  JLR: { name: 'Jabalpur Airport (Dumna)',                              city: 'Jabalpur',      country: 'India', region: 'IN' },
  AGR: { name: 'Agra Airport (Pandit Deen Dayal Upadhyay)',             city: 'Agra',          country: 'India', region: 'IN' },
  KNY: { name: 'Kanpur Airport',                                        city: 'Kanpur',        country: 'India', region: 'IN' },

  // ─── INDIA — North East ───────────────────────────────────────────────────
  IXA: { name: 'Maharaja Bir Bikram Airport',                           city: 'Agartala',      country: 'India', region: 'IN' },
  DIB: { name: 'Dibrugarh Airport',                                     city: 'Dibrugarh',     country: 'India', region: 'IN' },
  JRH: { name: 'Jorhat Airport',                                        city: 'Jorhat',        country: 'India', region: 'IN' },
  IXS: { name: 'Kumbhirgram Airport',                                   city: 'Silchar',       country: 'India', region: 'IN' },
  DMU: { name: 'Dimapur Airport',                                       city: 'Dimapur',       country: 'India', region: 'IN' },
  AJL: { name: 'Lengpui Airport',                                       city: 'Aizawl',        country: 'India', region: 'IN' },
  IXI: { name: 'Lilabari Airport',                                      city: 'Lilabari',      country: 'India', region: 'IN' },
  TEZ: { name: 'Tezpur Airport (Salonibari)',                           city: 'Tezpur',        country: 'India', region: 'IN' },

  // ─── INDIA — Himalayan & Hill Stations ───────────────────────────────────
  IXL: { name: 'Kushok Bakula Rimpochee Airport',                       city: 'Leh',           country: 'India', region: 'IN' },
  KUU: { name: 'Bhuntar Airport',                                       city: 'Kullu / Manali', country: 'India', region: 'IN' },
  DED: { name: 'Jolly Grant Airport',                                   city: 'Dehradun',      country: 'India', region: 'IN' },
  PGH: { name: 'Pantnagar Airport',                                     city: 'Pantnagar',     country: 'India', region: 'IN' },

  // ─── INDIA — South India ──────────────────────────────────────────────────
  VGA: { name: 'Vijayawada Airport',                                    city: 'Vijayawada',    country: 'India', region: 'IN' },
  RJA: { name: 'Rajahmundry Airport',                                   city: 'Rajahmundry',   country: 'India', region: 'IN' },
  TIR: { name: 'Tirupati Airport',                                      city: 'Tirupati',      country: 'India', region: 'IN' },
  CDP: { name: 'Kadapa Airport',                                        city: 'Kadapa',        country: 'India', region: 'IN' },
  IXG: { name: 'Belagavi Airport (Sambra)',                             city: 'Belagavi',      country: 'India', region: 'IN' },
  HBX: { name: 'Hubli Airport',                                         city: 'Hubballi',      country: 'India', region: 'IN' },
  MYQ: { name: 'Mysore Airport',                                        city: 'Mysuru',        country: 'India', region: 'IN' },
  BZU: { name: 'Bellary Airport',                                       city: 'Ballari',       country: 'India', region: 'IN' },
  TCR: { name: 'Thoothukudi Airport',                                   city: 'Thoothukudi',   country: 'India', region: 'IN' },
  SXV: { name: 'Salem Airport',                                         city: 'Salem',         country: 'India', region: 'IN' },
  TRD: { name: 'Kazi Nazrul Islam Airport',                             city: 'Durgapur',      country: 'India', region: 'IN' },
  PNY: { name: 'Puducherry Airport',                                    city: 'Puducherry',    country: 'India', region: 'IN' },

  // ─── INDIA — West & Gujarat ───────────────────────────────────────────────
  IXY: { name: 'Kandla Airport',                                        city: 'Kandla',        country: 'India', region: 'IN' },
  NMB: { name: 'Daman Airport',                                         city: 'Daman',         country: 'India', region: 'IN' },
  KLH: { name: 'Kolhapur Airport',                                      city: 'Kolhapur',      country: 'India', region: 'IN' },
  NDC: { name: 'Nanded Airport',                                        city: 'Nanded',        country: 'India', region: 'IN' },
  OMN: { name: 'Osmanabad Airport',                                     city: 'Osmanabad',     country: 'India', region: 'IN' },

  // ────────────────────────────────────────────────────────────────────────
  // INTERNATIONAL — Gulf / Middle East (Top destinations for Indians)
  // ────────────────────────────────────────────────────────────────────────
  DXB: { name: 'Dubai International Airport',                           city: 'Dubai',         country: 'UAE',          region: 'INT' },
  AUH: { name: 'Abu Dhabi International Airport',                       city: 'Abu Dhabi',     country: 'UAE',          region: 'INT' },
  SHJ: { name: 'Sharjah International Airport',                         city: 'Sharjah',       country: 'UAE',          region: 'INT' },
  DWC: { name: 'Al Maktoum International Airport (Dubai South)',        city: 'Dubai',         country: 'UAE',          region: 'INT' },
  DOH: { name: 'Hamad International Airport',                           city: 'Doha',          country: 'Qatar',        region: 'INT' },
  KWI: { name: 'Kuwait International Airport',                          city: 'Kuwait City',   country: 'Kuwait',       region: 'INT' },
  BAH: { name: 'Bahrain International Airport',                         city: 'Manama',        country: 'Bahrain',      region: 'INT' },
  MCT: { name: 'Muscat International Airport',                          city: 'Muscat',        country: 'Oman',         region: 'INT' },
  SLL: { name: 'Salalah Airport',                                       city: 'Salalah',       country: 'Oman',         region: 'INT' },
  RUH: { name: 'King Khalid International Airport',                     city: 'Riyadh',        country: 'Saudi Arabia', region: 'INT' },
  JED: { name: 'King Abdulaziz International Airport',                  city: 'Jeddah',        country: 'Saudi Arabia', region: 'INT' },
  MED: { name: 'Prince Mohammad Bin Abdulaziz Airport',                 city: 'Madinah',       country: 'Saudi Arabia', region: 'INT' },
  DMM: { name: 'King Fahd International Airport',                       city: 'Dammam',        country: 'Saudi Arabia', region: 'INT' },
  TLV: { name: 'Ben Gurion International Airport',                      city: 'Tel Aviv',      country: 'Israel',       region: 'INT' },

  // ─── South East Asia ──────────────────────────────────────────────────────
  SIN: { name: 'Singapore Changi Airport',                              city: 'Singapore',     country: 'Singapore',    region: 'INT' },
  KUL: { name: 'Kuala Lumpur International Airport',                    city: 'Kuala Lumpur',  country: 'Malaysia',     region: 'INT' },
  BKK: { name: 'Suvarnabhumi Airport',                                  city: 'Bangkok',       country: 'Thailand',     region: 'INT' },
  DMK: { name: 'Don Mueang International Airport',                      city: 'Bangkok',       country: 'Thailand',     region: 'INT' },
  HKT: { name: 'Phuket International Airport',                          city: 'Phuket',        country: 'Thailand',     region: 'INT' },
  HKG: { name: 'Hong Kong International Airport',                       city: 'Hong Kong',     country: 'Hong Kong',    region: 'INT' },
  CGK: { name: 'Soekarno–Hatta International Airport',                  city: 'Jakarta',       country: 'Indonesia',    region: 'INT' },
  DPS: { name: 'Ngurah Rai International Airport',                      city: 'Bali',          country: 'Indonesia',    region: 'INT' },
  MNL: { name: 'Ninoy Aquino International Airport',                    city: 'Manila',        country: 'Philippines',  region: 'INT' },
  RGN: { name: 'Yangon International Airport',                          city: 'Yangon',        country: 'Myanmar',      region: 'INT' },
  REP: { name: 'Siem Reap International Airport',                       city: 'Siem Reap',     country: 'Cambodia',     region: 'INT' },

  // ─── East Asia ────────────────────────────────────────────────────────────
  NRT: { name: 'Narita International Airport',                          city: 'Tokyo',         country: 'Japan',        region: 'INT' },
  HND: { name: 'Tokyo Haneda Airport',                                  city: 'Tokyo',         country: 'Japan',        region: 'INT' },
  ICN: { name: 'Incheon International Airport',                         city: 'Seoul',         country: 'South Korea',  region: 'INT' },
  PEK: { name: 'Beijing Capital International Airport',                 city: 'Beijing',       country: 'China',        region: 'INT' },
  PKX: { name: 'Beijing Daxing International Airport',                  city: 'Beijing',       country: 'China',        region: 'INT' },
  PVG: { name: 'Shanghai Pudong International Airport',                 city: 'Shanghai',      country: 'China',        region: 'INT' },
  CAN: { name: 'Guangzhou Baiyun International Airport',                city: 'Guangzhou',     country: 'China',        region: 'INT' },

  // ─── South Asia ───────────────────────────────────────────────────────────
  CMB: { name: 'Bandaranaike International Airport',                    city: 'Colombo',       country: 'Sri Lanka',    region: 'INT' },
  KTM: { name: 'Tribhuvan International Airport',                       city: 'Kathmandu',     country: 'Nepal',        region: 'INT' },
  DAC: { name: 'Hazrat Shahjalal International Airport',                city: 'Dhaka',         country: 'Bangladesh',   region: 'INT' },
  CGP: { name: 'Shah Amanat International Airport',                     city: 'Chittagong',    country: 'Bangladesh',   region: 'INT' },
  ISB: { name: 'Islamabad International Airport',                       city: 'Islamabad',     country: 'Pakistan',     region: 'INT' },
  MLE: { name: 'Velana International Airport',                          city: 'Malé',          country: 'Maldives',     region: 'INT' },
  PBH: { name: 'Paro International Airport',                            city: 'Paro',          country: 'Bhutan',       region: 'INT' },

  // ─── Europe ───────────────────────────────────────────────────────────────
  LHR: { name: 'Heathrow Airport',                                      city: 'London',        country: 'UK',           region: 'INT' },
  LGW: { name: 'Gatwick Airport',                                       city: 'London',        country: 'UK',           region: 'INT' },
  MAN: { name: 'Manchester Airport',                                    city: 'Manchester',    country: 'UK',           region: 'INT' },
  BHX: { name: 'Birmingham Airport',                                    city: 'Birmingham',    country: 'UK',           region: 'INT' },
  STN: { name: 'London Stansted Airport',                               city: 'London',        country: 'UK',           region: 'INT' },
  CDG: { name: 'Charles de Gaulle Airport',                             city: 'Paris',         country: 'France',       region: 'INT' },
  ORY: { name: 'Paris Orly Airport',                                    city: 'Paris',         country: 'France',       region: 'INT' },
  FRA: { name: 'Frankfurt Airport',                                     city: 'Frankfurt',     country: 'Germany',      region: 'INT' },
  MUC: { name: 'Munich Airport',                                        city: 'Munich',        country: 'Germany',      region: 'INT' },
  AMS: { name: 'Amsterdam Schiphol Airport',                            city: 'Amsterdam',     country: 'Netherlands',  region: 'INT' },
  ZRH: { name: 'Zurich Airport',                                        city: 'Zurich',        country: 'Switzerland',  region: 'INT' },
  GVA: { name: 'Geneva Airport',                                        city: 'Geneva',        country: 'Switzerland',  region: 'INT' },
  FCO: { name: 'Rome Fiumicino Airport',                                city: 'Rome',          country: 'Italy',        region: 'INT' },
  MXP: { name: 'Milan Malpensa Airport',                                city: 'Milan',         country: 'Italy',        region: 'INT' },
  BCN: { name: 'Barcelona El Prat Airport',                             city: 'Barcelona',     country: 'Spain',        region: 'INT' },
  MAD: { name: 'Adolfo Suárez Madrid–Barajas Airport',                  city: 'Madrid',        country: 'Spain',        region: 'INT' },
  VIE: { name: 'Vienna International Airport',                          city: 'Vienna',        country: 'Austria',      region: 'INT' },
  BRU: { name: 'Brussels Airport',                                      city: 'Brussels',      country: 'Belgium',      region: 'INT' },
  CPH: { name: 'Copenhagen Airport',                                    city: 'Copenhagen',    country: 'Denmark',      region: 'INT' },
  ARN: { name: 'Stockholm Arlanda Airport',                             city: 'Stockholm',     country: 'Sweden',       region: 'INT' },
  IST: { name: 'Istanbul Airport',                                      city: 'Istanbul',      country: 'Turkey',       region: 'INT' },
  SAW: { name: 'Sabiha Gökçen International Airport',                   city: 'Istanbul',      country: 'Turkey',       region: 'INT' },
  ATH: { name: 'Athens International Airport',                          city: 'Athens',        country: 'Greece',       region: 'INT' },
  PRG: { name: 'Václav Havel Airport Prague',                           city: 'Prague',        country: 'Czech Republic', region: 'INT' },
  BUD: { name: 'Budapest Ferenc Liszt International Airport',           city: 'Budapest',      country: 'Hungary',      region: 'INT' },
  WAW: { name: 'Warsaw Chopin Airport',                                 city: 'Warsaw',        country: 'Poland',       region: 'INT' },
  LIS: { name: 'Humberto Delgado Airport',                              city: 'Lisbon',        country: 'Portugal',     region: 'INT' },

  // ─── North America ────────────────────────────────────────────────────────
  JFK: { name: 'John F. Kennedy International Airport',                 city: 'New York',      country: 'USA',          region: 'INT' },
  EWR: { name: 'Newark Liberty International Airport',                  city: 'New York',      country: 'USA',          region: 'INT' },
  ORD: { name: "O'Hare International Airport",                          city: 'Chicago',       country: 'USA',          region: 'INT' },
  LAX: { name: 'Los Angeles International Airport',                     city: 'Los Angeles',   country: 'USA',          region: 'INT' },
  SFO: { name: 'San Francisco International Airport',                   city: 'San Francisco', country: 'USA',          region: 'INT' },
  IAD: { name: 'Washington Dulles International Airport',               city: 'Washington DC', country: 'USA',          region: 'INT' },
  IAH: { name: 'George Bush Intercontinental Airport',                  city: 'Houston',       country: 'USA',          region: 'INT' },
  ATL: { name: 'Hartsfield-Jackson Atlanta International Airport',      city: 'Atlanta',       country: 'USA',          region: 'INT' },
  BOS: { name: 'Logan International Airport',                           city: 'Boston',        country: 'USA',          region: 'INT' },
  SEA: { name: 'Seattle-Tacoma International Airport',                  city: 'Seattle',       country: 'USA',          region: 'INT' },
  DFW: { name: 'Dallas/Fort Worth International Airport',               city: 'Dallas',        country: 'USA',          region: 'INT' },
  YYZ: { name: 'Toronto Pearson International Airport',                 city: 'Toronto',       country: 'Canada',       region: 'INT' },
  YVR: { name: 'Vancouver International Airport',                       city: 'Vancouver',     country: 'Canada',       region: 'INT' },

  // ─── Oceania ──────────────────────────────────────────────────────────────
  SYD: { name: 'Sydney Kingsford Smith Airport',                        city: 'Sydney',        country: 'Australia',    region: 'INT' },
  MEL: { name: 'Melbourne Airport',                                     city: 'Melbourne',     country: 'Australia',    region: 'INT' },
  BNE: { name: 'Brisbane Airport',                                      city: 'Brisbane',      country: 'Australia',    region: 'INT' },
  PER: { name: 'Perth Airport',                                         city: 'Perth',         country: 'Australia',    region: 'INT' },
  AKL: { name: 'Auckland Airport',                                      city: 'Auckland',      country: 'New Zealand',  region: 'INT' },

  // ─── Africa ───────────────────────────────────────────────────────────────
  NBO: { name: 'Jomo Kenyatta International Airport',                   city: 'Nairobi',       country: 'Kenya',        region: 'INT' },
  JNB: { name: 'OR Tambo International Airport',                        city: 'Johannesburg',  country: 'South Africa', region: 'INT' },
  CPT: { name: 'Cape Town International Airport',                       city: 'Cape Town',     country: 'South Africa', region: 'INT' },
  ADD: { name: 'Bole International Airport',                            city: 'Addis Ababa',   country: 'Ethiopia',     region: 'INT' },
  CAI: { name: 'Cairo International Airport',                           city: 'Cairo',         country: 'Egypt',        region: 'INT' },

  // ─── Indian Ocean Islands ─────────────────────────────────────────────────
  MRU: { name: 'Sir Seewoosagur Ramgoolam International Airport',       city: 'Mauritius',     country: 'Mauritius',    region: 'INT' },
  SEZ: { name: 'Seychelles International Airport',                      city: 'Mahé',          country: 'Seychelles',   region: 'INT' },
  RRG: { name: 'Sir Charles Gaëtan Duval Airport',                      city: 'Rodrigues',     country: 'Mauritius',    region: 'INT' },

  // ─── Central Asia / Russia ────────────────────────────────────────────────
  SVO: { name: 'Sheremetyevo International Airport',                    city: 'Moscow',        country: 'Russia',       region: 'INT' },
  DME: { name: 'Domodedovo International Airport',                      city: 'Moscow',        country: 'Russia',       region: 'INT' },
  TAS: { name: 'Islam Karimov Tashkent International Airport',          city: 'Tashkent',      country: 'Uzbekistan',   region: 'INT' },
  ALA: { name: 'Almaty International Airport',                          city: 'Almaty',        country: 'Kazakhstan',   region: 'INT' },
};

/**
 * Returns a short display-friendly string: "Full Airport Name, City (Country)"
 * Falls back to "<IATA> Airport" when the code is not in the list.
 */
export function airportDisplayName(iata: string): string {
  const e = AIRPORTS[iata.toUpperCase()];
  if (!e) { return `${iata} Airport`; }
  return `${e.name}, ${e.city}${e.country !== 'India' ? ` (${e.country})` : ''}`;
}

/**
 * Returns the short name used for Google Maps queries.
 * e.g. "Indira Gandhi International Airport Delhi"
 */
export function airportMapsQuery(iata: string): string {
  const e = AIRPORTS[iata.toUpperCase()];
  if (!e) { return `${iata} Airport India`; }
  return `${e.name} ${e.city}`;
}

/**
 * Flat Record<string, string> for backward-compat with AIRPORT_NAMES usages.
 * Value format: "<name> <city>"
 */
export const AIRPORT_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(AIRPORTS).map(([iata, e]) => [iata, `${e.name} ${e.city}`]),
);

/** All Indian airports as an array, sorted by city name */
export const INDIAN_AIRPORTS = Object.entries(AIRPORTS)
  .filter(([, e]) => e.region === 'IN')
  .sort((a, b) => a[1].city.localeCompare(b[1].city))
  .map(([iata, e]) => ({ iata, ...e }));

/** International airports as an array */
export const INTERNATIONAL_AIRPORTS = Object.entries(AIRPORTS)
  .filter(([, e]) => e.region === 'INT')
  .sort((a, b) => a[1].city.localeCompare(b[1].city))
  .map(([iata, e]) => ({ iata, ...e }));
