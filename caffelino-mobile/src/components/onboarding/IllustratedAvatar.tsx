import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { IllustratedAvatarOption } from '../../constants/avatars';

interface IllustratedAvatarProps {
  avatar: IllustratedAvatarOption;
  size?: number;
}

/** Flat illustrated avatar built with pure Views — no emoji assets */
export function IllustratedAvatar({ avatar, size = 120 }: IllustratedAvatarProps) {
  const scale = size / 120;
  const s = (n: number) => n * scale;

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <View style={[styles.bg, { backgroundColor: avatar.bgColor, borderRadius: size * 0.28 }]} />

      {/* Hair back */}
      {avatar.hairStyle === 'long' && (
        <View
          style={[
            styles.hairBack,
            {
              backgroundColor: avatar.hairColor,
              width: s(72),
              height: s(48),
              top: s(38),
              borderBottomLeftRadius: s(24),
              borderBottomRightRadius: s(24),
            },
          ]}
        />
      )}

      {/* Neck */}
      <View
        style={[
          styles.neck,
          { backgroundColor: avatar.skinTone, width: s(22), height: s(16), top: s(68) },
        ]}
      />

      {/* Shirt */}
      <View
        style={[
          styles.shirt,
          {
            backgroundColor: avatar.shirtColor,
            width: s(64),
            height: s(36),
            top: s(78),
            borderBottomLeftRadius: s(12),
            borderBottomRightRadius: s(12),
          },
        ]}
      />

      {/* Face */}
      <View
        style={[
          styles.face,
          {
            backgroundColor: avatar.skinTone,
            width: s(52),
            height: s(56),
            top: s(24),
            borderRadius: s(26),
          },
        ]}
      >
        {/* Eyes */}
        <View style={[styles.eyesRow, { top: s(20) }]}>
          <View style={[styles.eye, { width: s(6), height: s(8) }]} />
          <View style={[styles.eye, { width: s(6), height: s(8) }]} />
        </View>
        {/* Smile */}
        <View
          style={[
            styles.smile,
            {
              width: s(18),
              height: s(9),
              top: s(36),
              borderBottomLeftRadius: s(9),
              borderBottomRightRadius: s(9),
            },
          ]}
        />
        {/* Blush */}
        <View style={[styles.blush, { left: s(6), top: s(30), width: s(8), height: s(5) }]} />
        <View style={[styles.blush, { right: s(6), top: s(30), width: s(8), height: s(5) }]} />
      </View>

      {/* Hair front */}
      {renderHairFront(avatar, s)}

      {/* Accessories */}
      {avatar.accessory === 'glasses' && (
        <View style={[styles.glasses, { top: s(38), width: s(44), height: s(14) }]}>
          <View style={[styles.lens, { width: s(16), height: s(14) }]} />
          <View style={[styles.lens, { width: s(16), height: s(14) }]} />
        </View>
      )}
      {avatar.accessory === 'earrings' && (
        <>
          <View style={[styles.earring, { left: s(28), top: s(52) }]} />
          <View style={[styles.earring, { right: s(28), top: s(52) }]} />
        </>
      )}
    </View>
  );
}

function renderHairFront(avatar: IllustratedAvatarOption, s: (n: number) => number) {
  const { hairStyle, hairColor } = avatar;

  if (hairStyle === 'short') {
    return (
      <View
        style={[
          styles.hairTop,
          {
            backgroundColor: hairColor,
            width: s(58),
            height: s(28),
            top: s(16),
            borderTopLeftRadius: s(20),
            borderTopRightRadius: s(20),
          },
        ]}
      />
    );
  }
  if (hairStyle === 'curly') {
    return (
      <>
        <View style={[styles.curl, { backgroundColor: hairColor, left: s(30), top: s(12), width: s(18) }]} />
        <View style={[styles.curl, { backgroundColor: hairColor, left: s(44), top: s(10), width: s(20) }]} />
        <View style={[styles.curl, { backgroundColor: hairColor, left: s(58), top: s(14), width: s(16) }]} />
      </>
    );
  }
  if (hairStyle === 'bun') {
    return (
      <>
        <View
          style={[
            styles.hairTop,
            {
              backgroundColor: hairColor,
              width: s(54),
              height: s(22),
              top: s(18),
              borderTopLeftRadius: s(18),
              borderTopRightRadius: s(18),
            },
          ]}
        />
        <View
          style={[
            styles.bun,
            { backgroundColor: hairColor, width: s(26), height: s(26), top: s(8), right: s(28) },
          ]}
        />
      </>
    );
  }
  if (hairStyle === 'waves') {
    return (
      <View
        style={[
          styles.hairTop,
          {
            backgroundColor: hairColor,
            width: s(60),
            height: s(32),
            top: s(14),
            borderTopLeftRadius: s(24),
            borderTopRightRadius: s(24),
          },
        ]}
      />
    );
  }
  if (hairStyle === 'long') {
    return (
      <View
        style={[
          styles.hairTop,
          {
            backgroundColor: hairColor,
            width: s(56),
            height: s(26),
            top: s(16),
            borderTopLeftRadius: s(20),
            borderTopRightRadius: s(20),
          },
        ]}
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', overflow: 'hidden', position: 'relative' },
  bg: { ...StyleSheet.absoluteFillObject },
  hairBack: { position: 'absolute', alignSelf: 'center' },
  neck: { position: 'absolute', alignSelf: 'center', borderRadius: 6 },
  shirt: { position: 'absolute', alignSelf: 'center' },
  face: { position: 'absolute', alignSelf: 'center' },
  eyesRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 14,
    alignSelf: 'center',
  },
  eye: { backgroundColor: '#2B1B17', borderRadius: 4 },
  smile: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#C6866B',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  blush: { position: 'absolute', backgroundColor: 'rgba(255,160,140,0.35)', borderRadius: 4 },
  hairTop: { position: 'absolute', alignSelf: 'center' },
  curl: { position: 'absolute', height: 18, borderRadius: 12 },
  bun: { position: 'absolute', borderRadius: 20 },
  glasses: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lens: {
    borderWidth: 2,
    borderColor: '#2B1B17',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  earring: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4A373',
  },
});
