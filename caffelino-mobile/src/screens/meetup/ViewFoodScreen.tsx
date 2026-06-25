import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../theme';
import type { MainStackParamList, CartLine } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'ViewFood'>;

export function ViewFoodScreen({ navigation, route }: Props) {
  const { items = [] } = route.params;
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.espresso} />
        </Pressable>
        <Text style={[styles.title, { color: palette.espresso }]}>Food Ordered</Text>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={[styles.emptyTitle, { color: palette.espresso }]}>Nothing ordered yet</Text>
          <Text style={[styles.emptySub, { color: palette.textMuted }]}>
            The host hasn't added any items to the bill.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items as CartLine[]}
          keyExtractor={(item) => item.cartItemId || item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, { backgroundColor: palette.white, borderColor: palette.border }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: palette.espresso }]}>
                  {item.name} <Text style={{ color: palette.goldAccent }}>×{item.quantity}</Text>
                </Text>
                <Text style={[styles.itemCat, { color: palette.textMuted }]}>{item.category || 'Food & Bev'}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: palette.darkCoffee }]}>₹{item.price * item.quantity}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  title: { ...typography.h3, fontSize: 18 },
  list: { padding: spacing.md },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  itemInfo: { flex: 1, marginRight: spacing.sm },
  itemName: { ...typography.h4, fontSize: 16 },
  itemCat: { ...typography.bodySmall, marginTop: 2 },
  itemPrice: { ...typography.h3, fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.xs },
  emptySub: { ...typography.body, textAlign: 'center' },
});
