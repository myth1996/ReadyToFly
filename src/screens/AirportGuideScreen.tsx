import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useFlights } from '../context/FlightsContext';
import { adService } from '../services/AdService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdGuard } from '../services/AdGuard';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AirportInfo = {
  code: string;
  name: string;
  city: string;
  terminals: string;
  lounges: string;
  transport: string;
  wifi: string;
  helpline: string;
  food: string;
  facilities: string;
};

const AIRPORTS: AirportInfo[] = [
  // ─── Top Metro International Hubs ────────────────────────────────────────
  // ─── Top Metro International Hubs ────────────────────────────────────────
  {
    code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi',
    terminals: 'T1 (Domestic low-cost), T2 (Domestic), T3 (International & full-service domestic)',
    lounges: 'Plaza Premium (T1, T3), ITC Green Lounge (T3), Air India Maharaja (T3)',
    transport: 'Airport Express Metro to New Delhi (20 min, ₹60) · Cab ₹350–600 · Bus ₹50',
    wifi: 'Free 30 min Wi-Fi (Tata Docomo)',
    helpline: '0124-337-6000',
    food: 'T3: Burger King, Subway, KFC, Wok & Roll, Cafe Coffee Day, Haldiram\'s · T1: McDonald\'s, Café TB, Biryani Blues · Prices ₹150–600',
    facilities: 'Prayer rooms (T2 & T3) · Medical center · Children\'s play area · Smoking zones · Currency exchange · ATMs · Baby care rooms · Duty-free shopping · Pharmacy',
  },
  {
    code: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai',
    terminals: 'T1 (Domestic), T2 (International & select domestic)',
    lounges: 'Pranaam (T2), GVK Lounge (T2), Adani Lounge (T1)',
    transport: 'Western Railway Andheri ₹10 · Cab ₹400–700 · BEST Bus ₹100–150',
    wifi: 'Free 45 min Wi-Fi',
    helpline: '022-6685-1010',
    food: 'T2: The Great Indian Café, McDonald\'s, Baskin Robbins, Starbucks, Bombay Bar · T1: Café Coffee Day, Juice bars, Snack counters · Prices ₹100–500',
    facilities: 'Yoga room (T2, airside) · Prayer room · Medical center · ATMs · Duty-free (Heinemann) · Baby care · Smoking lounges · Baggage wrapping',
  },
  {
    code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru',
    terminals: 'T1 (Domestic & International), T2 (IndiGo & others, opened 2023)',
    lounges: 'Above Ground Level (T1), BLR Lounge (T1), Plaza Premium (T2)',
    transport: 'BMTC Vayu Vajra Bus ₹250–350 · Cab ₹600–900 · Kempegowda Metro (upcoming 2025)',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '080-2201-2001',
    food: 'T1: Mast Kalandar, Subway, Starbucks, Keventers, Chili\'s, Kaati Zone · T2: Food court with Café Coffee Day, MTR, KFC · Prices ₹100–500',
    facilities: 'Medical center · Prayer room · Yoga room (T2) · Currency exchange · ATMs · Duty-free · Baby care rooms · Smoking zones · Luggage storage',
  },
  {
    code: 'MAA', name: 'Chennai International', city: 'Chennai',
    terminals: 'T1 (Domestic), T4 (International)',
    lounges: 'TFS Lounge (T1), Travel Club (T4)',
    transport: 'MRTS Tirusulam Station ₹10 · Cab ₹300–500 · MTC Bus ₹30',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '044-2256-0551',
    food: 'T1: Murugan Idli Shop, Café Coffee Day, Subway · T4: The Great Kabab Factory, Mainland China, KFC · Prices ₹80–400',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Duty-free shopping · Baby care · Smoking zones · Coat check',
  },
  {
    code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad',
    terminals: 'Single integrated terminal (Domestic + International)',
    lounges: 'Plaza Premium · Above Ground Level · ITC Green Lounge',
    transport: 'Pushpak Bus ₹250 · Cab ₹800–1200 · Metro to Raidurg + cab',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '040-6546-6370',
    food: 'Paradise Biryani, McDonald\'s, Starbucks, Subway, Spice Zone, KFC, Café Coffee Day · Prices ₹100–500',
    facilities: 'Prayer rooms (Islamic, Hindu, Christian) · Medical center · ATMs · Currency exchange · Duty-free · Children\'s play area · Baby care · Smoking zones',
  },
  {
    code: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata',
    terminals: 'Integrated terminal (Domestic gates 1–8, International gates 9–20)',
    lounges: 'TFS Lounge · Travel Club Lounge · Priority Pass accepted',
    transport: 'AC Bus ₹70–100 · Cab ₹250–500 · Metro Dum Dum station ₹10–30',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '033-2511-8787',
    food: 'Oh! Calcutta, Mainland China, KFC, Café Coffee Day, Mio Amore, Dominos · Prices ₹80–400',
    facilities: 'Medical center · Prayer room · ATMs · Currency exchange · Duty-free · Baby care rooms · Smoking area · Luggage wrapping',
  },
  {
    code: 'COK', name: 'Cochin International', city: 'Kochi',
    terminals: 'T1 (International), T2 (Domestic), T3 (New International)',
    lounges: 'Cochin Lounge (T3) · Priority Pass accepted',
    transport: 'AC Bus ₹90 · Cab ₹600–1000 · Prepaid taxi counter',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0484-261-0115',
    food: 'Kerala Kitchen (traditional Kerala cuisine), KFC, Café Coffee Day, Subway, Juice Junction · Prices ₹80–350',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Duty-free · Baby care · Smoking zones · Solar-powered terminal (world\'s first)',
  },
  // ─── Tier-2 International ─────────────────────────────────────────────────
  {
    code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad',
    terminals: 'T1 (Domestic), T2 (International)',
    lounges: 'Encalm Lounge (T1) · Priority Pass accepted',
    transport: 'AMTS Bus ₹30 · Cab ₹200–400 · BRTS rapid bus ₹15',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '079-2286-9211',
    food: 'Agashiye (Gujarati thali), Amul Café, KFC, Café Coffee Day, Juice Corner · Prices ₹80–350 (all-veg options widely available)',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Baby care · Duty-free · Smoking zone',
  },
  {
    code: 'GOI', name: 'Manohar International (Mopa)', city: 'Goa',
    terminals: 'Single terminal (Manohar International Airport)',
    lounges: 'Adani Lounge · Priority Pass accepted',
    transport: 'Kadamba Bus ₹200 · Cab ₹1200–2000 (South Goa) · Prepaid taxi counter',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0832-254-0806',
    food: 'Martin\'s Corner (Goan cuisine), KFC, Subway, Café Coffee Day, Goan snacks counter · Prices ₹100–450',
    facilities: 'Medical center · ATMs · Currency exchange · Duty-free · Baby care · Prayer room · Smoking zone',
  },
  {
    code: 'TRV', name: 'Trivandrum International', city: 'Thiruvananthapuram',
    terminals: 'Single terminal (Domestic + International)',
    lounges: 'Kerala Tourism Lounge · Priority Pass accepted',
    transport: 'KSRTC Bus ₹15–30 · Cab ₹250–400 · Auto ₹150–200',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0471-250-1426',
    food: 'Kerala meals, Café Coffee Day, KFC, Juice Junction, Saravana Bhavan · Prices ₹60–300',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Baby care · Duty-free · Smoking area',
  },
  {
    code: 'CCJ', name: 'Calicut International', city: 'Kozhikode',
    terminals: 'Single terminal (Domestic + International)',
    lounges: 'Travel Club Lounge · Priority Pass accepted',
    transport: 'KSRTC Bus ₹20 · Cab ₹400–600 · Auto ₹300–450',
    wifi: 'Free Wi-Fi',
    helpline: '0483-271-6101',
    food: 'Paragon Restaurant (Malabar cuisine), Café Coffee Day, KFC, Snack counters · Prices ₹60–300',
    facilities: 'Prayer room (large mosque nearby) · Medical center · ATMs · Currency exchange · Baby care',
  },
  {
    code: 'CNN', name: 'Kannur International', city: 'Kannur',
    terminals: 'Single terminal (opened 2018)',
    lounges: 'Lounge available at departure level',
    transport: 'KSRTC Bus ₹50 · Cab ₹400–700',
    wifi: 'Free Wi-Fi',
    helpline: '0497-286-8600',
    food: 'Local Kerala snacks, Café Coffee Day, Juice bar · Prices ₹50–200',
    facilities: 'Prayer room · Medical post · ATMs · Baby care · Currency exchange counter',
  },
  {
    code: 'ATQ', name: 'Sri Guru Ram Dass Jee International', city: 'Amritsar',
    terminals: 'Single integrated terminal',
    lounges: 'TFS Lounge · Priority Pass accepted',
    transport: 'Cab ₹200–400 · Auto ₹100–200 · Bus ₹30',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0183-259-2596',
    food: 'Punjabi Dhaba (dhabha-style), KFC, Café Coffee Day, Bikanervala · Prices ₹80–300',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Baby care · Duty-free',
  },
  {
    code: 'IXC', name: 'Chandigarh International', city: 'Chandigarh',
    terminals: 'Single integrated terminal',
    lounges: 'Lounge at departure level · Priority Pass accepted',
    transport: 'Cab ₹200–350 · PRTC Bus ₹30 · Auto ₹150',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0172-500-6101',
    food: 'Pal Dhaba, Café Coffee Day, KFC, Snack counters · Prices ₹80–300',
    facilities: 'Medical center · Prayer room · ATMs · Currency exchange · Baby care · Smoking zone',
  },
  {
    code: 'SXR', name: 'Sheikh ul Alam Airport', city: 'Srinagar',
    terminals: 'Single terminal (Domestic + limited International)',
    lounges: 'Basic lounge at departure',
    transport: 'Cab ₹300–500 · Auto ₹200 · No public bus service',
    wifi: 'Free Wi-Fi',
    helpline: '0194-240-3354',
    food: 'Kashmiri Wazwan counter, Café, Snack bar · Prices ₹60–250 · Wazwan dishes ₹150–300',
    facilities: 'Prayer room · Medical post · ATMs · Currency exchange · Warm waiting areas (cold climate)',
  },
  // ─── Domestic International ───────────────────────────────────────────────
  {
    code: 'PNQ', name: 'Pune International', city: 'Pune',
    terminals: 'New integrated terminal (2023)',
    lounges: 'TFS Lounge · Encalm Lounge · Priority Pass accepted',
    transport: 'PMPML Bus ₹30 · Cab ₹200–400 · Auto ₹150–250',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '020-2691-4510',
    food: 'Vohuman Café, Café Coffee Day, Subway, McDonald\'s, Juice Up · Prices ₹80–350',
    facilities: 'Medical center · Prayer room · ATMs · Currency exchange · Baby care · Duty-free · Smoking zone',
  },
  {
    code: 'JAI', name: 'Jaipur International', city: 'Jaipur',
    terminals: 'Single integrated terminal',
    lounges: 'TFS Lounge · Encalm Lounge',
    transport: 'Cab ₹200–350 · RSRTC Bus ₹40 · Auto ₹150',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0141-255-0623',
    food: 'Chokhi Dhani Express (Rajasthani), KFC, Café Coffee Day, Bikanervala · Prices ₹80–350',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Baby care · Duty-free · Smoking zone',
  },
  {
    code: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow',
    terminals: 'Single integrated terminal',
    lounges: 'TFS Lounge · Priority Pass accepted',
    transport: 'UPSRTC Bus ₹50 · Cab ₹300–500 · Auto ₹200',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0522-243-9009',
    food: 'Tunday Kababi, Café Coffee Day, KFC, Bikanervala, Dominos · Prices ₹80–350',
    facilities: 'Prayer room · Medical center · ATMs · Currency exchange · Baby care · Duty-free',
  },
  {
    code: 'NAG', name: 'Dr Babasaheb Ambedkar International', city: 'Nagpur',
    terminals: 'Single integrated terminal',
    lounges: 'Lounge at departure level',
    transport: 'Cab ₹150–300 · City Bus ₹30 · Auto ₹100',
    wifi: 'Free Wi-Fi',
    helpline: '0712-266-5151',
    food: 'Haldiram\'s, Café Coffee Day, KFC, Vilas Ladoo counter, Snack bars · Prices ₹60–300',
    facilities: 'Medical post · Prayer room · ATMs · Baby care · Currency exchange',
  },
  {
    code: 'VNS', name: 'Lal Bahadur Shastri Airport', city: 'Varanasi',
    terminals: 'New terminal (2023)',
    lounges: 'TFS Lounge',
    transport: 'Cab ₹300–500 · UP Bus ₹40 · Auto ₹200',
    wifi: 'Free Wi-Fi',
    helpline: '0542-262-2665',
    food: 'Baati Chokha restaurant (Banarasi), Café Coffee Day, Snack counters · Prices ₹60–250',
    facilities: 'Prayer room (temple motifs) · Medical post · ATMs · Baby care · Currency exchange',
  },
  {
    code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna',
    terminals: 'Single terminal',
    lounges: 'Basic lounge',
    transport: 'Cab ₹200–350 · BSRTC Bus ₹30 · Auto ₹150',
    wifi: 'Free Wi-Fi',
    helpline: '0612-222-9950',
    food: 'Litti Chokha counter, Café Coffee Day, Snack bar · Prices ₹50–200',
    facilities: 'Medical post · Prayer room · ATMs · Baby care',
  },
  {
    code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International', city: 'Guwahati',
    terminals: 'Single integrated terminal',
    lounges: 'TFS Lounge · Priority Pass accepted',
    transport: 'ASTC Bus ₹50 · Cab ₹400–700 · Auto ₹300',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0361-284-0150',
    food: 'Khorikaa (Assamese cuisine), Café Coffee Day, KFC, Snack counters · Prices ₹70–300',
    facilities: 'Medical center · Prayer room · ATMs · Currency exchange · Baby care · Duty-free · Smoking zone',
  },
  {
    code: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar',
    terminals: 'New integrated terminal (2013)',
    lounges: 'TFS Lounge · Priority Pass accepted',
    transport: 'OSRTC Bus ₹40 · Cab ₹250–450 · Auto ₹150',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0674-253-6644',
    food: 'Dalma (Odia cuisine), Café Coffee Day, KFC, Snack counters · Prices ₹60–300',
    facilities: 'Medical center · Prayer room · ATMs · Baby care · Currency exchange · Smoking zone',
  },
  {
    code: 'VTZ', name: 'Visakhapatnam International', city: 'Visakhapatnam',
    terminals: 'Single integrated terminal (new domestic + international)',
    lounges: 'Lounge at departure · Priority Pass accepted',
    transport: 'APSRTC Bus ₹30 · Cab ₹300–550 · Auto ₹200',
    wifi: 'Free Wi-Fi',
    helpline: '0891-271-6272',
    food: 'Andhra meals (spicy), Café Coffee Day, KFC, Juice bar · Prices ₹60–280',
    facilities: 'Medical post · Prayer room · ATMs · Baby care · Currency exchange',
  },
  {
    code: 'CJB', name: 'Coimbatore International', city: 'Coimbatore',
    terminals: 'Single terminal (Domestic + select International)',
    lounges: 'Lounge at departure level',
    transport: 'TNSTC Bus ₹20 · Cab ₹200–350 · Auto ₹150',
    wifi: 'Free Wi-Fi',
    helpline: '0422-257-2933',
    food: 'Annapoorna (South Indian), Café Coffee Day, KFC, Juice Planet · Prices ₹60–250',
    facilities: 'Medical post · Prayer room · ATMs · Baby care · Currency exchange',
  },
  {
    code: 'TRZ', name: 'Tiruchirappalli International', city: 'Tiruchirappalli',
    terminals: 'Single integrated terminal',
    lounges: 'Basic lounge',
    transport: 'TNSTC Bus ₹15 · Cab ₹200–350 · Auto ₹100',
    wifi: 'Free Wi-Fi',
    helpline: '0431-234-0551',
    food: 'Sree Krishna Bhavan (Tamil meals), Café, Snack bar · Prices ₹50–200',
    facilities: 'Prayer room · Medical post · ATMs · Baby care',
  },
  {
    code: 'IXE', name: 'Mangaluru International', city: 'Mangaluru',
    terminals: 'Single terminal (Domestic + International)',
    lounges: 'Lounge at departure level · Priority Pass accepted',
    transport: 'KSRTC Bus ₹50 · Cab ₹400–700 · Auto ₹300',
    wifi: 'Free Wi-Fi',
    helpline: '0824-225-2591',
    food: 'Mitra Samaj (Mangalorean cuisine), Café Coffee Day, KFC, Snack counters · Prices ₹60–280',
    facilities: 'Prayer room · Medical post · ATMs · Currency exchange · Baby care',
  },
  {
    code: 'IXB', name: 'Bagdogra Airport', city: 'Siliguri',
    terminals: 'Single terminal (Domestic + limited International)',
    lounges: 'Basic lounge at departure',
    transport: 'Cab ₹400–700 · Shared jeep ₹100 to Siliguri · No direct bus',
    wifi: 'Free Wi-Fi',
    helpline: '0353-259-3010',
    food: 'Siliguri Momo Corner, Café, Snack bar · Prices ₹50–200 · Momos ₹60–100',
    facilities: 'Medical post · Prayer room · ATMs · Baby care',
  },
  {
    code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi',
    terminals: 'New terminal (2022)',
    lounges: 'TFS Lounge',
    transport: 'JSRTC Bus ₹40 · Cab ₹250–450 · Auto ₹150',
    wifi: 'Free Wi-Fi',
    helpline: '0651-245-2284',
    food: 'Jharkhand Tribal Food counter, Café Coffee Day, KFC, Snack bar · Prices ₹60–280',
    facilities: 'Medical center · Prayer room · ATMs · Baby care · Currency exchange',
  },
  {
    code: 'IXL', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh',
    terminals: 'Single terminal (Domestic + Bhutan)',
    lounges: 'No lounge (altitude: 3,256 m — India\'s highest commercial airport)',
    transport: 'Cab ₹300–500 · Shared taxi ₹100–200 · No bus',
    wifi: 'Limited Wi-Fi',
    helpline: '01982-252-226',
    food: 'Tibetan Kitchen (thukpa & momos), Basic café · Prices ₹80–250 · Altitude sickness: stay hydrated',
    facilities: 'Medical post (oxygen available) · Prayer flags area · ATMs (limited) · Altitude advisory board',
  },
  {
    code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal',
    terminals: 'New integrated terminal (2023)',
    lounges: 'TFS Lounge',
    transport: 'MPSRTC Bus ₹40 · Cab ₹200–400 · Auto ₹150',
    wifi: 'Free Wi-Fi',
    helpline: '0755-267-7003',
    food: 'Manohar Dairy (peda & namkeen), Café Coffee Day, KFC, Snack counters · Prices ₹60–280',
    facilities: 'Medical center · Prayer room · ATMs · Baby care · Currency exchange',
  },
  {
    code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur',
    terminals: 'Single terminal',
    lounges: 'Basic lounge',
    transport: 'Cab ₹250–450 · Auto ₹150 · No airport bus',
    wifi: 'Free Wi-Fi',
    helpline: '0294-265-5453',
    food: 'Natraj Dining (Rajasthani), Café, Snack bar · Prices ₹60–250',
    facilities: 'Medical post · Prayer room · ATMs · Baby care',
  },
  {
    code: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun',
    terminals: 'Single terminal',
    lounges: 'Basic lounge',
    transport: 'Cab ₹400–700 (to Dehradun) · Shared taxi ₹150 · No bus service',
    wifi: 'Free Wi-Fi',
    helpline: '0135-265-1103',
    food: 'Pahadi Dhaba (local Garhwali), Café, Snack bar · Prices ₹60–250 · Haridwar halwai sweets available',
    facilities: 'Medical post · Prayer room · ATMs · Baby care',
  },
  {
    code: 'IXM', name: 'Madurai Airport', city: 'Madurai',
    terminals: 'Single integrated terminal',
    lounges: 'Basic lounge',
    transport: 'TNSTC Bus ₹20 · Cab ₹200–350 · Auto ₹150',
    wifi: 'Free Wi-Fi',
    helpline: '0452-269-0433',
    food: 'Meenakshi Bhavan (Tamil meals), Café Coffee Day, KFC, Juice bar · Prices ₹60–250',
    facilities: 'Medical post · Prayer room (near Meenakshi Temple city) · ATMs · Baby care',
  },
  {
    code: 'TIR', name: 'Tirupati Airport', city: 'Tirupati',
    terminals: 'New integrated terminal (2019)',
    lounges: 'Lounge at departure level',
    transport: 'APSRTC Bus ₹30 · Cab ₹200–350 · Auto ₹100',
    wifi: 'Free Wi-Fi',
    helpline: '0877-228-8301',
    food: 'TTD Laddu counter (official prasadam), Café Coffee Day, South Indian snacks · Prices ₹30–250',
    facilities: 'Prayer room (Venkateshwara shrine inside terminal) · Medical post · ATMs · Baby care · Tonsuring facility nearby',
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

export function AirportGuideScreen() {
  const [selected, setSelected]           = useState<string | null>(null);
  const [pendingCode, setPendingCode]     = useState<string | null>(null); // awaiting ad
  const [rewardSheetVisible, setRewardSheetVisible] = useState(false);

  const { isPremiumUser }   = useAuth();
  const { themeColors: c }  = useSettings();
  const { nextFlight }      = useFlights();
  const navigation          = useNavigation<any>();

  // Collapse when navigating away
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setSelected(null));
    return unsub;
  }, [navigation]);

  const handleAirportPress = (code: string) => {
    // Collapsing — always allow
    if (selected === code) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelected(null);
      return;
    }

    // Premium users: expand immediately
    if (isPremiumUser) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelected(code);
      return;
    }

    // Check ad guard — suppress within 2h of departure
    const canShow = AdGuard.canShowAd(isPremiumUser, nextFlight);
    if (!canShow) {
      // No ads near departure — expand freely
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelected(code);
      return;
    }

    // Check if rewarded ad is ready
    if (!adService.isRewardedReady()) {
      // Silent fallback — never block the user
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelected(code);
      return;
    }

    // Show the reward bottom-sheet
    setPendingCode(code);
    setRewardSheetVisible(true);
  };

  const handleWatchAd = () => {
    setRewardSheetVisible(false);
    adService.showRewardedForAirportGuide(
      false, // already checked not premium above
      () => {
        // Rewarded: expand the card
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelected(pendingCode);
        setPendingCode(null);
      },
      () => {
        // Failed silently — show content anyway
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelected(pendingCode);
        setPendingCode(null);
      },
    );
  };

  const handleDismissSheet = () => {
    setRewardSheetVisible(false);
    setPendingCode(null);
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: c.background }]}
        contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: c.text }]}>Airport Guide</Text>
        <Text style={[styles.subheading, { color: c.textSecondary }]}>
          35 Indian Airports — tap any card to expand
        </Text>

        {AIRPORTS.map(airport => {
          const isExpanded = selected === airport.code;
          return (
            <View key={airport.code}>
              <TouchableOpacity
                style={[styles.row, { backgroundColor: c.card }, isExpanded && { borderColor: c.primary, borderWidth: 2 }]}
                onPress={() => handleAirportPress(airport.code)}
                activeOpacity={0.75}>
                <View style={[styles.codeBox, { backgroundColor: c.primary }]}>
                  <Text style={styles.code}>{airport.code}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.city, { color: c.text }]}>{airport.city}</Text>
                  <Text style={[styles.airportName, { color: c.textSecondary }]}>{airport.name}</Text>
                </View>
                <Text style={[styles.arrow, { color: c.primary }]}>
                  {isExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* Expandable content */}
              {isExpanded && (
                <View style={[styles.expandCard, { backgroundColor: c.card, borderColor: c.primary }]}>
                  <InfoRow emoji="🏛️" label="Terminals"  value={airport.terminals}  textColor={c.text} subColor={c.textSecondary} />
                  <InfoRow emoji="🛋️" label="Lounges"    value={airport.lounges}    textColor={c.text} subColor={c.textSecondary} />
                  <InfoRow emoji="🍽️" label="Food & Dining" value={airport.food}    textColor={c.text} subColor={c.textSecondary} />
                  <InfoRow emoji="🏥" label="Facilities" value={airport.facilities} textColor={c.text} subColor={c.textSecondary} />
                  <InfoRow emoji="🚗" label="Transport"  value={airport.transport}  textColor={c.text} subColor={c.textSecondary} />
                  <InfoRow emoji="📶" label="Wi-Fi"      value={airport.wifi}       textColor={c.text} subColor={c.textSecondary} />
                  <InfoRow emoji="📞" label="Helpline"   value={airport.helpline}   textColor={c.text} subColor={c.textSecondary} last />
                </View>
              )}
            </View>
          );
        })}
  
      {/* ── Banner Ad (free users) ───────────────────────── */}
      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
    </ScrollView>

      {/* ── Rewarded Ad Bottom Sheet ──────────────────────────────────────── */}
      <Modal
        visible={rewardSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={handleDismissSheet}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={handleDismissSheet} />
        <View style={[styles.sheet, { backgroundColor: c.card }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetEmoji}>✈️</Text>
          <Text style={[styles.sheetTitle, { color: c.text }]}>Unlock Airport Details</Text>
          <Text style={[styles.sheetBody, { color: c.textSecondary }]}>
            Watch a short ad to unlock terminal, lounge &amp; transport info for this airport — or go Premium for instant access everywhere.
          </Text>
          <TouchableOpacity style={[styles.watchBtn, { backgroundColor: c.primary }]} onPress={handleWatchAd}>
            <Text style={styles.watchBtnTxt}>▶  Watch Ad to Unlock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.premiumBtn, { borderColor: c.primary }]} onPress={() => {
            handleDismissSheet();
            navigation.navigate('Premium');
          }}>
            <Text style={[styles.premiumBtnTxt, { color: c.primary }]}>👑  Get Premium — No Ads Ever</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleDismissSheet}>
            <Text style={[styles.cancelTxt, { color: c.textSecondary }]}>Not now</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ emoji, label, value, textColor, subColor, last }: {
  emoji: string; label: string; value: string; textColor: string; subColor: string; last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { marginBottom: 0 }]}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: subColor }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 20 },

  // Rewarded bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
    alignItems: 'center',
    width: SCREEN_W,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 20 },
  sheetEmoji: { fontSize: 40, marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  sheetBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 20, paddingHorizontal: 8 },
  watchBtn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 10 },
  watchBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  premiumBtn: { borderRadius: 14, borderWidth: 2, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 10 },
  premiumBtnTxt: { fontWeight: '800', fontSize: 15 },
  cancelBtn: { paddingVertical: 10 },
  cancelTxt: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  codeBox: {
    borderRadius: 8,
    width: 52,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  code: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  info: { flex: 1 },
  city: { fontSize: 15, fontWeight: '700' },
  airportName: { fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 12, marginLeft: 8 },
  expandCard: {
    marginTop: -6,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  infoEmoji: { fontSize: 18, marginRight: 12, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 13, lineHeight: 19 },
});
