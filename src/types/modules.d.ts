/**
 * Type stubs for native modules installed on device but not in dev node_modules
 */

declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: { contact?: string; email?: string; name?: string };
    theme?: { color?: string };
    [key: string]: any;
  }
  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }
  interface RazorpayModule {
    open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>;
  }
  const RazorpayCheckout: RazorpayModule;
  export default RazorpayCheckout;
}

declare module 'react-native-haptic-feedback' {
  type HapticFeedbackType =
    | 'selection' | 'impactLight' | 'impactMedium' | 'impactHeavy'
    | 'notificationSuccess' | 'notificationWarning' | 'notificationError';
  interface HapticOptions {
    enableVibrateFallback?: boolean;
    ignoreAndroidSystemSettings?: boolean;
  }
  interface HapticFeedbackModule {
    trigger(type: HapticFeedbackType, options?: HapticOptions): void;
  }
  const HapticFeedback: HapticFeedbackModule;
  export default HapticFeedback;
}

declare module '@react-native-async-storage/async-storage' {
  interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    multiGet(keys: string[]): Promise<readonly [string, string | null][]>;
    multiSet(keyValuePairs: Array<[string, string]>): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
  }
  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}

declare module '@notifee/react-native' {
  export enum AndroidImportance {
    NONE = 0,
    MIN = 1,
    LOW = 2,
    DEFAULT = 3,
    HIGH = 4,
  }
  export enum AndroidCategory {
    ALARM = 'alarm',
    CALL = 'call',
    EMAIL = 'email',
    ERROR = 'err',
    EVENT = 'event',
    MESSAGE = 'msg',
    NAVIGATION = 'navigation',
    PROGRESS = 'progress',
    PROMO = 'promo',
    RECOMMENDATION = 'recommendation',
    REMINDER = 'reminder',
    SERVICE = 'service',
    SOCIAL = 'social',
    STATUS = 'status',
    SYSTEM = 'sys',
    TRANSPORT = 'transport',
  }
  export enum TriggerType {
    TIMESTAMP = 0,
    INTERVAL = 1,
  }
  export interface TimestampTrigger {
    type: TriggerType.TIMESTAMP;
    timestamp: number;
    repeatFrequency?: number;
  }
  export interface IntervalTrigger {
    type: TriggerType.INTERVAL;
    interval: number;
  }
  type Trigger = TimestampTrigger | IntervalTrigger;
  interface AndroidNotification {
    channelId: string;
    importance?: AndroidImportance;
    category?: AndroidCategory;
    pressAction?: { id: string };
    smallIcon?: string;
    [key: string]: any;
  }
  interface Notification {
    id?: string;
    title?: string;
    body?: string;
    android?: AndroidNotification;
    [key: string]: any;
  }
  interface Channel {
    id: string;
    name: string;
    importance?: AndroidImportance;
    sound?: string;
    vibration?: boolean;
    [key: string]: any;
  }
  interface NotifeeInterface {
    createChannel(channel: Channel): Promise<string>;
    requestPermission(): Promise<{ authorizationStatus: number }>;
    createTriggerNotification(notification: Notification, trigger: Trigger): Promise<string>;
    cancelNotification(id: string): Promise<void>;
    cancelAllNotifications(): Promise<void>;
    displayNotification(notification: Notification): Promise<string>;
  }
  const notifee: NotifeeInterface;
  export default notifee;
}
