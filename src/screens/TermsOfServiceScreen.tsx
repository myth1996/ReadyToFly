import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export function TermsOfServiceScreen() {
  const { themeColors: c } = useSettings();

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>

      <Text style={[styles.title, { color: c.text }]}>Terms of Service</Text>
      <Text style={[styles.date, { color: c.textSecondary }]}>
        Last updated: March 2026
      </Text>

      <Section title="1. Acceptance of Terms" c={c}>
        By downloading, installing, or using the ReadyToFly mobile application
        ("App"), you agree to be bound by these Terms of Service ("Terms").
        If you do not agree, please uninstall and discontinue use of the App.
        These Terms are governed by the laws of India.
      </Section>

      <Section title="2. Description of Service" c={c}>
        ReadyToFly is a travel companion app designed for Indian air travellers.
        The App provides tools including:{'\n\n'}
        • Leave-By Calculator — estimates when to leave home for your flight{'\n'}
        • Document Checklist — helps you ensure you have required documents{'\n'}
        • Flight Alerts — notifies you of gate changes and delays{'\n'}
        • Airport Guide — information about major Indian airports{'\n'}
        • Calm Mode — breathing exercises for anxious flyers{'\n\n'}
        Flight data is sourced from third-party APIs. While we strive for
        accuracy, ReadyToFly is not responsible for missed flights due to
        inaccurate or delayed flight data.
      </Section>

      <Section title="3. User Accounts" c={c}>
        You must provide a valid Indian mobile number to create an account.
        You are responsible for maintaining the security of your account.
        You must notify us immediately if you suspect unauthorised access to
        your account. You must be at least 13 years old to use this App.
      </Section>

      <Section title="4. Premium Subscriptions" c={c}>
        ReadyToFly offers a premium subscription ("ReadyToFly Premium") with the
        following plans:{'\n\n'}
        • Monthly: ₹99/month{'\n'}
        • Yearly: ₹499/year{'\n'}
        • Lifetime: ₹4,999 (one-time){'\n\n'}
        Payments are processed securely by Razorpay and are subject to
        Razorpay's terms. Subscriptions automatically renew unless cancelled
        at least 24 hours before the renewal date. Refunds are subject to
        our Refund Policy and applicable Indian consumer protection laws.
      </Section>

      <Section title="5. Acceptable Use" c={c}>
        You agree not to:{'\n\n'}
        • Use the App for any unlawful purpose{'\n'}
        • Attempt to reverse-engineer, decompile, or extract source code{'\n'}
        • Use the App to transmit spam, malware, or harmful content{'\n'}
        • Impersonate another person or entity{'\n'}
        • Interfere with the App's servers or security systems{'\n'}
        • Use automated scripts or bots to interact with the App
      </Section>

      <Section title="6. Advertisements" c={c}>
        The free tier of ReadyToFly displays advertisements provided by Google
        AdMob. These ads may be personalised based on your general interests.
        Premium subscribers enjoy an ad-free experience. We do not endorse
        any product or service advertised within the App.
      </Section>

      <Section title="7. Disclaimer of Warranties" c={c}>
        ReadyToFly is provided "as is" and "as available" without warranties of
        any kind. We do not warrant that:{'\n\n'}
        • The App will be uninterrupted or error-free{'\n'}
        • Flight data will always be accurate or up-to-date{'\n'}
        • The App will meet your specific requirements{'\n\n'}
        ReadyToFly is a travel aid tool and should not be your sole source of
        flight information. Always verify critical information (gate, timing,
        cancellations) directly with your airline or airport.
      </Section>

      <Section title="8. Limitation of Liability" c={c}>
        To the maximum extent permitted by Indian law, ReadyToFly and its
        developers shall not be liable for any indirect, incidental, or
        consequential damages arising from your use of the App, including
        but not limited to missed flights, lost baggage, or travel
        disruptions.
      </Section>

      <Section title="9. Intellectual Property" c={c}>
        All content, features, and functionality of the App — including but
        not limited to text, graphics, logos, and software — are owned by
        ReadyToFly and are protected under Indian intellectual property laws.
        You may not reproduce or distribute any part of the App without our
        prior written permission.
      </Section>

      <Section title="10. Termination" c={c}>
        We reserve the right to suspend or terminate your account at our
        discretion if you violate these Terms. Upon termination, your right
        to use the App ceases immediately. Provisions of these Terms that by
        their nature should survive termination will remain in effect.
      </Section>

      <Section title="11. Governing Law &amp; Disputes" c={c}>
        These Terms are governed by the laws of India. Any disputes arising
        from these Terms shall be subject to the exclusive jurisdiction of
        the courts in West Bengal, India. We encourage you to contact us
        first to resolve any disputes amicably.
      </Section>

      <Section title="12. Changes to Terms" c={c}>
        We may revise these Terms at any time. We will notify you of material
        changes via an in-app notification. Your continued use of the App
        after the effective date of any changes constitutes your acceptance
        of the revised Terms.
      </Section>

      <Section title="13. Contact Us" c={c}>
        If you have any questions about these Terms, please contact us:{'\n\n'}
        📧 support@readytofly.in{'\n'}
        🌐 www.readytofly.in{'\n\n'}
        We aim to respond to all queries within 5 business days.
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  date: { fontSize: 13, marginBottom: 24 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22 },
});
