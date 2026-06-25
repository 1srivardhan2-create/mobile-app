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
import { radius, shadows, spacing, typography } from '../../theme';

const sections = [
  {
    title: '1. Event Bookings',
    icon: 'calendar-outline' as const,
    items: [
      'Users are responsible for verifying event details before booking.',
      'Event organizers are responsible for the accuracy of event information.',
      'Caffelino only provides the platform for event discovery and bookings.',
    ],
  },
  {
    title: '2. Payments',
    icon: 'card-outline' as const,
    items: [
      'All payments are processed through secure third-party payment gateways.',
      'Successful payment confirmation is required for ticket generation.',
      'Users must retain payment receipts for reference.',
    ],
  },
  {
    title: '3. Refund Policy',
    icon: 'refresh-outline' as const,
    items: [
      'Refund eligibility depends on the organizer\'s policy.',
      'Caffelino may assist with disputes but does not guarantee refunds.',
      'Processing times may vary depending on the payment provider.',
    ],
  },
  {
    title: '4. User Conduct',
    icon: 'person-outline' as const,
    items: [
      'Users must provide accurate information.',
      'Misuse, fraud, abuse, or unauthorized access may result in account suspension.',
      'Users must comply with local laws and regulations.',
    ],
  },
  {
    title: '5. Organizer Responsibilities',
    icon: 'business-outline' as const,
    items: [
      'Organizers must provide genuine event details.',
      'Organizers are responsible for event execution and attendee management.',
      'Organizers must comply with all applicable legal requirements.',
    ],
  },
  {
    title: '6. Coupons & Promotions',
    icon: 'pricetag-outline' as const,
    items: [
      'Coupons may have minimum order requirements.',
      'Coupons cannot be exchanged for cash.',
      'Caffelino reserves the right to modify or discontinue promotions at any time.',
    ],
  },
  {
    title: '7. Privacy',
    icon: 'shield-checkmark-outline' as const,
    items: [
      'User information is protected according to our Privacy Policy.',
      'Personal data will not be sold to third parties.',
    ],
  },
  {
    title: '8. Limitation of Liability',
    icon: 'alert-circle-outline' as const,
    items: [
      'Caffelino is not responsible for losses caused by event cancellations, venue issues, organizer actions, or force majeure events.',
    ],
  },
  {
    title: '9. Account Termination',
    icon: 'ban-outline' as const,
    items: [
      'Caffelino reserves the right to suspend or terminate accounts that violate platform policies.',
    ],
  },
  {
    title: '10. Changes to Terms',
    icon: 'document-text-outline' as const,
    items: [
      'These terms may be updated periodically.',
      'Continued use of the platform constitutes acceptance of revised terms.',
    ],
  },
];

export function TermsAndConditionsScreen() {
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
            backgroundColor: palette.coffeeBrown,
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
          <Text style={[styles.lastUpdated, { color: palette.coffeeBrown }]}>
            📅 Last Updated: June 11, 2026
          </Text>
          <Text style={[styles.introText, { color: palette.textSecondary }]}>
            Welcome to{' '}
            <Text style={{ fontWeight: '700', color: palette.espresso }}>Caffelino</Text>. By using
            our platform, you agree to the following terms and conditions. Please read them carefully
            before using any of our services.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View
            key={idx}
            style={[styles.sectionCard, shadows.soft, { backgroundColor: palette.white }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${palette.coffeeBrown}18` }]}>
                <Ionicons name={section.icon} size={20} color={palette.coffeeBrown} />
              </View>
              <Text style={[styles.sectionTitle, { color: palette.espresso }]}>
                {section.title}
              </Text>
            </View>
            {section.items.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: palette.coffeeBrown }]} />
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
            { backgroundColor: palette.coffeeBrown },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="mail-outline" size={20} color="#FFF" />
            </View>
            <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Contact</Text>
          </View>
          <Text style={[styles.bulletText, { color: 'rgba(255,255,255,0.8)', marginLeft: 0, marginBottom: 6 }]}>
            For support, queries, refunds, partnerships, or legal concerns:
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
