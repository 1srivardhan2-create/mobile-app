import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing } from '../../theme';

const sections = [
  {
    title: '1. Information We Collect',
    icon: 'information-circle-outline' as const,
    items: [
      'Personal identification information (name, phone number, email address).',
      'Profile information including your avatar and city.',
      'Event booking and ticket history.',
      'Payment transaction metadata (we do not store card details).',
      'Device information, app usage patterns, and log data for analytics.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    icon: 'settings-outline' as const,
    items: [
      'To provide, operate, and improve the Caffelino platform.',
      'To facilitate event bookings, ticket generation, and QR codes.',
      'To process payments securely via third-party payment gateways.',
      'To send event confirmations, updates, and support communications.',
      'To personalize your experience and show relevant cafés and events.',
      'To detect and prevent fraud, misuse, or unauthorized access.',
    ],
  },
  {
    title: '3. Data Sharing',
    icon: 'share-social-outline' as const,
    items: [
      'We do not sell your personal data to any third parties.',
      'We share data with event organizers only to the extent needed for event management (e.g., attendee name, contact for check-in).',
      'We may share data with trusted service providers (e.g., Cloudinary, Razorpay) strictly for platform functionality.',
      'We may disclose data if required by law, court order, or government authority.',
    ],
  },
  {
    title: '4. Payment Security',
    icon: 'lock-closed-outline' as const,
    items: [
      'Payments are processed by Razorpay, a PCI-DSS compliant payment gateway.',
      'Caffelino never stores your credit/debit card numbers or CVV.',
      'All payment transactions are encrypted using industry-standard SSL/TLS.',
    ],
  },
  {
    title: '5. Data Retention',
    icon: 'time-outline' as const,
    items: [
      'We retain your account and booking data as long as your account is active.',
      'You may request deletion of your account and data by contacting us.',
      'Some data may be retained for legal or compliance purposes even after deletion.',
    ],
  },
  {
    title: '6. Cookies & Analytics',
    icon: 'analytics-outline' as const,
    items: [
      'The app may collect anonymous usage analytics to improve performance.',
      'No personal data is shared with advertising networks.',
      'You may opt out of analytics in your device settings.',
    ],
  },
  {
    title: '7. Your Rights',
    icon: 'person-circle-outline' as const,
    items: [
      'You have the right to access the personal data we hold about you.',
      'You can request correction of inaccurate or incomplete data.',
      'You can request deletion of your account and associated data.',
      'You can withdraw consent for data processing at any time.',
      'Contact us at caffelino.9@gmail.com to exercise these rights.',
    ],
  },
  {
    title: '8. Third-Party Links',
    icon: 'link-outline' as const,
    items: [
      'The app may contain links to external websites or services.',
      'Caffelino is not responsible for the privacy practices of third-party sites.',
      'We encourage you to review the privacy policies of any external services you use.',
    ],
  },
  {
    title: '9. Children\'s Privacy',
    icon: 'people-outline' as const,
    items: [
      'Caffelino is not intended for users under the age of 13.',
      'We do not knowingly collect personal data from children under 13.',
      'If you believe a child has provided us with personal data, please contact us immediately.',
    ],
  },
  {
    title: '10. Changes to This Policy',
    icon: 'document-text-outline' as const,
    items: [
      'We may update this Privacy Policy from time to time.',
      'Changes will be communicated through the app or by email.',
      'Continued use of the platform after changes constitutes your acceptance.',
    ],
  },
];

export function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { palette } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: palette.cream }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: '#1A237E',
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSub}>Caffelino Platform</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={[styles.introCard, shadows.soft, { backgroundColor: palette.white }]}>
          <Text style={[styles.lastUpdated, { color: '#1A237E' }]}>
            📅 Last Updated: June 11, 2026
          </Text>
          <Text style={[styles.introText, { color: palette.textSecondary }]}>
            At{' '}
            <Text style={{ fontWeight: '700', color: palette.espresso }}>Caffelino</Text>, your
            privacy matters. This Privacy Policy explains how we collect, use, and protect your
            personal information when you use our app. By using Caffelino, you agree to the practices
            described in this policy.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View
            key={idx}
            style={[styles.sectionCard, shadows.soft, { backgroundColor: palette.white }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#1A237E18' }]}>
                <Ionicons name={section.icon} size={20} color="#1A237E" />
              </View>
              <Text style={[styles.sectionTitle, { color: palette.espresso }]}>
                {section.title}
              </Text>
            </View>
            {section.items.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: '#1A237E' }]} />
                <Text style={[styles.bulletText, { color: palette.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact Section */}
        <View
          style={[
            styles.sectionCard,
            shadows.soft,
            { backgroundColor: '#1A237E' },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="mail-outline" size={20} color="#FFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Contact Us</Text>
          </View>
          <Text style={[styles.bulletText, { color: 'rgba(255,255,255,0.85)', marginLeft: 0, marginBottom: 6 }]}>
            For privacy-related questions, data access requests, or concerns:
          </Text>
          <Text style={[styles.emailText, { color: '#FFF' }]}>
            📧 caffelino.9@gmail.com
          </Text>
          <Text style={[styles.bulletText, { color: 'rgba(255,255,255,0.75)', marginLeft: 0 }]}>
            We will respond as soon as possible during business hours.
          </Text>
        </View>

        {/* Footer note */}
        <Text style={[styles.footerNote, { color: palette.textMuted }]}>
          © 2026 Caffelino. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  introCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
