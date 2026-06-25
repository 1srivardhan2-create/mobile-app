import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  Explore: { label: 'Explore', icon: 'compass-outline', iconActive: 'compass' },
  Events: { label: 'Events', icon: 'calendar-outline', iconActive: 'calendar' },
  Loved: { label: 'Loved', icon: 'heart-outline', iconActive: 'heart' },
};

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const indicatorX = useSharedValue(0);

  const tabWidth = 100 / state.routes.length;

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorX.value}%` as unknown as number,
    width: `${tabWidth}%` as unknown as number,
  }));

  React.useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, { damping: 18, stiffness: 180 });
  }, [state.index, tabWidth, indicatorX]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + spacing.sm,
          backgroundColor: palette.cream,
          borderTopColor: palette.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.indicator,
          indicatorStyle,
          { backgroundColor: palette.goldAccent },
        ]}
      />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.Home;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            <Ionicons
              name={focused ? config.iconActive : config.icon}
              size={22}
              color={focused ? palette.coffeeBrown : palette.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: focused ? palette.coffeeBrown : palette.textMuted },
              ]}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: radius.full,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
