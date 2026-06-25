import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CafeCard } from '../../components/home/CafeCard';
import { CoffeeLoader } from '../../components/ui/CoffeeLoader';
import { useTheme } from '../../context/ThemeContext';
import { useCafes } from '../../hooks/useCafes';
import type { MainStackParamList, MainTabParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Explore'>,
  NativeStackScreenProps<MainStackParamList>
>;

const CATEGORIES = [
  'All',
  'Cafe',
  'Roastery',
  'Bistro',
  'Work Friendly',
  'Study Friendly',
  'Quiet',
  'Outdoor',
  'Pet Friendly',
];

export function ExploreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { cafes, loading } = useCafes();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    let list = cafes;
    if (category !== 'All') {
      list = list.filter(
        (c) =>
          c.establishmentType?.toLowerCase().includes(category.toLowerCase()) ||
          category === 'Cafe',
      );
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.Name?.toLowerCase().includes(q) ||
          c.Cafe_Address?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [cafes, query, category]);

  return (
    <View style={[styles.container, { backgroundColor: palette.cream, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: palette.espresso, paddingHorizontal: spacing.lg }]}>Explore</Text>

      <Animated.View
        style={[
          styles.searchWrap,
          {
            backgroundColor: palette.white,
            borderColor: searchFocused ? palette.goldAccent : palette.border,
            transform: [{ scale: searchFocused ? 1.02 : 1 }],
            marginHorizontal: spacing.lg,
          },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: palette.espresso }]}
          placeholder="Search cafés..."
          placeholderTextColor={palette.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </Animated.View>

      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categories}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 8, paddingTop: 4 }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
            >
              {category === cat ? (
                <LinearGradient
                  colors={[palette.coffeeBrown, palette.darkCoffee]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.chip, { borderWidth: 0 }]}
                >
                  <Text style={[styles.chipText, { color: palette.white }]}>
                    {cat}
                  </Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: palette.white,
                      borderColor: palette.coffeeBrown + '40', // Light brown border (25% opacity)
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: palette.coffeeBrown }]}>
                    {cat}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <CoffeeLoader />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
              <View style={styles.listCard}>
                <CafeCard
                  cafe={item}
                  index={index}
                  fullWidth
                  onPress={() => navigation.navigate('CafeDetails', { cafeId: item._id, initialCafe: item })}
                />
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: palette.textMuted }]}>No cafés found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...typography.h1, marginVertical: spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: { fontSize: 18, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 16 },
  categoriesWrapper: { marginBottom: spacing.sm },
  categories: {},
  chip: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontWeight: '600',
    fontSize: 14,
  },
  list: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  listCard: { width: '100%' },
  empty: { textAlign: 'center', marginTop: spacing.xl },
});
