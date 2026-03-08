/**
 * WidgetService — Android homescreen widget bridge.
 *
 * This service provides the JS-side API for updating the FlyEasy flight
 * countdown widget. The native side (AppWidgetProvider) must be wired
 * separately in the Android project.
 *
 * ─── Native setup required (one-time, do after JS is ready) ─────────────────
 *
 * 1. In android/app/src/main/res/xml/ create flyeasy_widget_info.xml:
 *
 *    <appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
 *      android:minWidth="250dp"  android:minHeight="80dp"
 *      android:updatePeriodMillis="1800000"
 *      android:initialLayout="@layout/flyeasy_widget"
 *      android:widgetCategory="home_screen" />
 *
 * 2. Create android/app/src/main/res/layout/flyeasy_widget.xml (RemoteViews layout)
 *    with TextViews for flightNum, countdown, route.
 *
 * 3. Create FlyEasyWidgetProvider.java (or .kt) extending AppWidgetProvider.
 *    On ACTION_APPWIDGET_UPDATE, read SharedPreferences key "flyeasy_widget"
 *    and update RemoteViews.
 *
 * 4. In AndroidManifest.xml:
 *    <receiver android:name=".FlyEasyWidgetProvider" android:exported="true">
 *      <intent-filter>
 *        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
 *      </intent-filter>
 *      <meta-data android:name="android.appwidget.provider"
 *        android:resource="@xml/flyeasy_widget_info" />
 *    </receiver>
 *
 * 5. Create FlyEasyWidgetModule.java as a ReactContextBaseJavaModule
 *    exposing a @ReactMethod "updateWidget(ReadableMap data)" that:
 *    - Writes JSON to SharedPreferences key "flyeasy_widget"
 *    - Calls AppWidgetManager.updateAppWidget() to force refresh
 *
 * 6. Register in MainApplication via ReactPackage.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { NativeModules } from 'react-native';

export type WidgetData = {
  flightIata: string;
  depIata: string;
  arrIata: string;
  departureTime: string;   // ISO string
  countdown: string;       // e.g. "2h 30m"
  status: string;          // e.g. "On Time"
};

const { FlyEasyWidget } = NativeModules as {
  FlyEasyWidget?: {
    updateWidget: (data: WidgetData) => void;
    clearWidget: () => void;
  };
};

const isAvailable = !!FlyEasyWidget;

/**
 * Push the next-flight info to the homescreen widget.
 * Safe to call even if the native module is not yet wired — it no-ops.
 */
export function updateWidget(data: WidgetData): void {
  if (!isAvailable) { return; }
  try {
    FlyEasyWidget!.updateWidget(data);
  } catch { /* fail silently */ }
}

/**
 * Clear the widget (no upcoming flights).
 */
export function clearWidget(): void {
  if (!isAvailable) { return; }
  try {
    FlyEasyWidget!.clearWidget();
  } catch { /* fail silently */ }
}

export const widgetService = { updateWidget, clearWidget, isAvailable };
