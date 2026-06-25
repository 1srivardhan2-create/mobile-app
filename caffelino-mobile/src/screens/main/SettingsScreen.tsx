import React from 'react';
import { StyleSheet, Text, View, Switch, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { MainStackParamList } from '../../types';
import { spacing, radius, typography, shadows } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette, isDark, setMode } = useTheme();
  const { logout } = useAuth();
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  type SettingsRow = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  };

  const rows: SettingsRow[] = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      subtitle: 'Push alerts for events and updates',
      rightElement: (
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ true: palette.coffeeBrown, false: palette.border }}
        />
      ),
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Conditions',
      subtitle: 'Read our platform terms',
      onPress: () => navigation.navigate('TermsAndConditions'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy Policy',
      subtitle: 'How we protect your data',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={palette.espresso} />
        </Pressable>
        <Text style={[styles.title, { color: palette.espresso }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Rows */}
      {rows.map((row) => (
        <Pressable
          key={row.label}
          onPress={row.onPress}
          disabled={!row.onPress}
          style={({ pressed }) => [
            styles.row,
            shadows.soft,
            { backgroundColor: palette.white, opacity: pressed && row.onPress ? 0.9 : 1 },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${palette.coffeeBrown}18` }]}>
            <Ionicons name={row.icon} size={20} color={palette.coffeeBrown} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: palette.espresso }]}>{row.label}</Text>
            {row.subtitle ? (
              <Text style={[styles.rowSub, { color: palette.textMuted }]}>{row.subtitle}</Text>
            ) : null}
          </View>
          {row.rightElement ?? (
            row.onPress ? <Ionicons name="chevron-forward" size={18} color={palette.textMuted} /> : null
          )}
        </Pressable>
      ))}

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={[styles.logoutBtn, { backgroundColor: palette.error }]}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  backBtn: { width: 40 },
  title: { ...typography.h1, flex: 1, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
