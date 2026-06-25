import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { IllustratedAvatar } from '../onboarding/IllustratedAvatar';
import { getAvatarById } from '../../constants/avatars';
import { colors } from '../../theme/colors';
import type { MainStackParamList } from '../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProfileAvatarButton() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const avatar = getAvatarById(user?.avatarId);

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.92);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={() => navigation.navigate('Profile')}
      style={[styles.outer, animStyle]}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <View style={styles.glow} />
      <View style={styles.ring}>
        <IllustratedAvatar avatar={avatar} size={40} />
      </View>
      <View style={styles.online} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    backgroundColor: colors.coffeeBrown,
    opacity: 0.15,
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.cream,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  online: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.forestGreen,
    borderWidth: 2,
    borderColor: colors.cream,
  },
});
