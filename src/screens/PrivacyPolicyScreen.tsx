import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export function PrivacyPolicyScreen() {
  const { themeColors: c } = useSettings();

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>

      <Text style={[styles.title, { color: c.text }]}>Privacy Policy</Text>
      <Text style={[styles.date, { color: c.textSecondary }]}>
        Last updated: March 2026
      </Text>

      <Section title="1. Introduction" c={c}>
        FlyEasy ("we", "our", "us") is committed to protecting your personal
        information. This Privacy Policy explains how we collect, use, and
        safeguard your data when you use the FlyEasy mobile application
        ("App"), which is operated in accordance with the Digital Personal
        Data Protection (DPDP) Act, 2023 of India.
      </Section>

      <Section title="2. Information We Collect" c={c}>
        <BulletItem c={c} label="Mobile Number">
          We collect your 10-digit Indian mobile number when you sign in via
          OTP. This is used solely for authentication.
        </BulletItem>
        <BulletItem c={c} label="Flight Information">
          Flight numbers and travel dates you enter are stored locally on
          your device and optionally synced to your account in Firebase for
          cross-device access.
        </BulletItem>
        <BulletItem c={c} label="Usage Data">
          We collect anonymised analytics (screens viewed, features used) to
          improve the App. No personally identifiable information is included
          in analytics events.
        </BulletItem>
        <BulletItem c={c} label="Device Information">
          Device model and OS version may be collected for crash reporting
          purposes only.
        </BulletItem>
      </Section>

      <Section title="3. How We Use Your Information" c={c}>
        <BulletItem c={c}>Authenticate you securely via Firebase OTP.</BulletItem>
        <BulletItem c={c}>Provide real-time flight status and gate change alerts.</BulletItem>
        <BulletItem c={c}>Remember your preferences (language, notification settings).</BulletItem>
        <BulletItem c={c}>Display relevant advertisements via Google AdMob (free-tier users only).</BulletItem>
        <BulletItem c={c}>Process premium subscription payments via Razorpay.</BulletItem>
      </Section>

      <Section title="4. Data Sharing" c={c}>
        We do not sell, trade, or rent your personal data. We share data only
        with the following trusted service providers who are bound by their
        own privacy policies:{'\n\n'}
        • Google Firebase — Authentication &amp; database{'\n'}
        • Google AdMob — Advertising (free users){'\n'}
        • Razorpay — Payment processing (premium users){'\n'}
        • AviationStack — Flight data API
      </Section>

      <Section title="5. Data Retention" c={c}>
        Your account data is retained for as long as your account is active.
        You may request deletion of your account and all associated data at
        any time by contacting us at the email below. We will process your
        request within 30 days as required under the DPDP Act, 2023.
      </Section>

      <Section title="6. Children's Privacy" c={c}>
        FlyEasy is not intended for children under the age of 13. We do not
        knowingly collect personal data from children.
      </Section>

      <Section title="7. Security" c={c}>
        We use industry-standard security measures including Firebase
        Authentication, HTTPS encryption for all API calls, and access
        controls on our database. However, no method of transmission over
        the internet is 100% secure.
      </Section>

      <Section title="8. Your Rights (DPDP Act, 2023)" c={c}>
        Under the Digital Personal Data Protection Act, 2023, you have the
        right to:{'\n\n'}
        • Access the personal data we hold about you{'\n'}
        • Correct inaccurate personal data{'\n'}
        • Erase your personal data ("right to be forgotten"){'\n'}
        • Withdraw consent at any time{'\n'}
        • Nominate a person to exercise your rights in case of your death
      </Section>

      <Section title="9. Changes to This Policy" c={c}>
        We may update this Privacy Policy from time to time. We will notify
        you of significant changes via an in-app notification. Continued use
        of the App after changes constitutes acceptance of the updated policy.
      </Section>

      <Section title="10. Contact Us" c={c}>
        For any privacy-related questions or to exercise your rights under
        the DPDP Act, please contact us at:{'\n\n'}
        📧 support@flyeasy.in{'\n'}
        🌐 www.flyeasy.in{'\n\n'}
        We will respond to all requests within 30 days.
      </Section>

    </ScrollView>
  );
}

function Section({
  title, children, c,
}: { title: string; children: React.ReactNode; c: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.primary }]}>{title}</Text>
      <Text style={[styles.body, { color: c.text }]}>{children}</Text>
    </View>
  );
}

function BulletItem({
  label, children, c,
}: { label?: string; children: React.ReactNode; c: any }) {
  return (
    <Text style={[styles.bullet, { color: c.text }]}>
      {'• '}
      {label ? <Text style={{ fontWeight: '700' }}>{label}: </Text> : null}
      {children}
      {'\n'}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  date: { fontSize: 13, marginBottom: 24 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 22 },
});
