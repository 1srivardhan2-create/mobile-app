import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, shadows } from '../../theme';

export function EventSuccessScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const ticketNumber = route.params?.ticketNumber || 'CAF-XXXX-XXXX';

  const handleViewTicket = () => {
    // Pop the success screen and go to MyTickets
    navigation.popToTop();
    navigation.navigate('MyTickets');
  };

  const handleBackToEvents = () => {
    navigation.popToTop();
    navigation.navigate('HomeTab');
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark" size={60} color="#FFF" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.textContainer}>
          <Text style={[styles.title, { color: palette.espresso }]}>Registration Successful 🎉</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            You have successfully secured your spot for the event!
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()} style={[styles.ticketCard, shadows.card, { backgroundColor: '#FFF' }]}>
          <Text style={[styles.ticketLabel, { color: palette.textSecondary }]}>TICKET NUMBER</Text>
          <Text style={[styles.ticketValue, { color: palette.goldAccent }]}>{ticketNumber}</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(700).springify()} style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.lg }]}>
        <Pressable 
          style={[styles.primaryBtn, { backgroundColor: palette.coffeeBrown }]} 
          onPress={handleViewTicket}
        >
          <Text style={styles.primaryBtnText}>View Ticket</Text>
        </Pressable>

        <Pressable 
          style={[styles.secondaryBtn, { borderColor: palette.coffeeBrown }]} 
          onPress={handleBackToEvents}
        >
          <Text style={[styles.secondaryBtnText, { color: palette.coffeeBrown }]}>Back To Events</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  iconContainer: { marginBottom: spacing.xl },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
  },
  textContainer: { alignItems: 'center', marginBottom: spacing.xl },
  title: { ...typography.h1, fontSize: 28, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.body, textAlign: 'center', fontSize: 16, paddingHorizontal: spacing.md },
  
  ticketCard: {
    padding: spacing.xl, borderRadius: radius.lg,
    width: '100%', alignItems: 'center',
    borderStyle: 'dashed', borderWidth: 2, borderColor: '#E0E0E0'
  },
  ticketLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm },
  ticketValue: { ...typography.h2, fontSize: 24, letterSpacing: 1 },
  
  bottomBar: { paddingHorizontal: spacing.xl, gap: spacing.md, width: '100%' },
  primaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: radius.full, alignItems: 'center'
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  secondaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: radius.full, alignItems: 'center',
    borderWidth: 2
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700' }
});
