import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CafeCard } from '../../components/home/CafeCard';
import { HomeHeader } from '../../components/home/HomeHeader';
import { MeetupActionCards } from '../../components/home/MeetupActionCards';
import { MyMeetupsHomeCard } from '../../components/home/MyMeetupsHomeCard';
import { CreateMeetupFlow } from '../../components/meetup/CreateMeetupFlow';
import { JoinMeetupFlow } from '../../components/meetup/JoinMeetupFlow';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useHostedMeetups } from '../../hooks/useHostedMeetups';
import { useMeetupActions } from '../../hooks/useMeetupActions';
import { useCafes } from '../../hooks/useCafes';
import type { MainStackParamList, MainTabParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<MainStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { cafes, loading, error, refetch } = useCafes();
  const meetup = useMeetupActions();
  const { registerMeetup, refresh: refreshHosted } = useHostedMeetups();
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Coffee Lover';

  const featured = cafes.slice(0, 6);
  const trending = [...cafes].sort(() => Math.random() - 0.5).slice(0, 6);

  const goToChat = (meetupId: string, meetupCode: string) => {
    navigation.navigate('MeetupChat', { meetupId, meetupCode });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="transparent" 
            colors={['transparent']} 
            progressBackgroundColor="transparent"
          />
        }
      >
        {refreshing && <CoffeeLoader mini message="Refreshing cafes" />}
        <HomeHeader firstName={firstName} onNotificationsPress={() => navigation.navigate('Notifications')} />

        <Pressable
          onPress={() => navigation.navigate('Explore')}
          style={[styles.searchBar, { backgroundColor: palette.white, borderColor: palette.border }]}
        >
          <Text style={{ color: palette.textMuted }}>Search cafés...</Text>
        </Pressable>

        <MeetupActionCards onCreatePress={meetup.openCreate} onJoinPress={meetup.openJoin} />

        <MyMeetupsHomeCard onPress={() => navigation.navigate('MyMeetups')} />

        {loading ? (
          <CoffeeLoader message="Finding great cafés..." />
        ) : error ? (
          <View style={{ padding: 20, backgroundColor: '#ffebee', borderRadius: 12 }}>
            <Text style={{ color: '#c62828', fontWeight: 'bold' }}>Error Loading Cafes:</Text>
            <Text style={{ color: '#c62828' }}>{error}</Text>
          </View>
        ) : cafes.length === 0 ? (
          <View style={{ padding: 20 }}>
            <Text style={{ color: palette.textMuted }}>No cafes found. Connected to: {process.env.EXPO_PUBLIC_API_BASE_URL || 'Production'}</Text>
          </View>
        ) : (
          <>
            <Section title="Featured Cafés" palette={palette}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featured.map((cafe, i) => (
                  <CafeCard
                    key={cafe._id}
                    cafe={cafe}
                    index={i}
                    onPress={() => navigation.navigate('CafeDetails', { cafeId: cafe._id, initialCafe: cafe })}
                  />
                ))}
              </ScrollView>
            </Section>

            <Section title="Trending Cafés" palette={palette}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {trending.map((cafe, i) => (
                  <CafeCard
                    key={`t-${cafe._id}`}
                    cafe={cafe}
                    index={i}
                    compact
                    onPress={() => navigation.navigate('CafeDetails', { cafeId: cafe._id, initialCafe: cafe })}
                  />
                ))}
              </ScrollView>
            </Section>
          </>
        )}
      </ScrollView>

      <CreateMeetupFlow
        visible={meetup.showCreate}
        onClose={meetup.closeCreate}
        onMeetupCreated={registerMeetup}
        onEnterChat={(id, code) => {
          refreshHosted();
          goToChat(id, code);
        }}
      />

      <JoinMeetupFlow
        visible={meetup.showJoin}
        onClose={meetup.closeJoin}
        onJoined={goToChat}
      />
    </View>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: { espresso: string };
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.espresso }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  searchBar: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
});
