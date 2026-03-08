/**
 * HapticService — Thin wrapper around react-native-haptic-feedback
 *
 * Fails silently if the package isn't installed or device doesn't support haptics.
 * Use this everywhere instead of calling the library directly.
 */

type HapticType =
  | 'selection'       // light tap — toggles, selections
  | 'impactLight'     // subtle impact
  | 'impactMedium'    // medium impact — button presses
  | 'impactHeavy'     // strong — SOS, urgent alerts
  | 'notificationSuccess'  // success — flight saved
  | 'notificationWarning'  // warning — urgency countdown
  | 'notificationError';   // error

function trigger(type: HapticType): void {
  try {
    const HapticFeedback = require('react-native-haptic-feedback').default;
    const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };
    HapticFeedback.trigger(type, options);
  } catch (_) {
    // Package not installed or device doesn't support haptics — fail silently
  }
}

export const haptic = {
  /** Light tap — language toggle, checkbox, switch */
  selection: () => trigger('selection'),

  /** Medium tap — button presses, card interactions */
  impact: () => trigger('impactMedium'),

  /** Heavy tap — SOS button, urgent actions */
  heavy: () => trigger('impactHeavy'),

  /** Success vibration — flight saved, payment complete */
  success: () => trigger('notificationSuccess'),

  /** Warning vibration — countdown urgency, almost time to leave */
  warning: () => trigger('notificationWarning'),

  /** Error vibration — failed lookup, payment error */
  error: () => trigger('notificationError'),
};
