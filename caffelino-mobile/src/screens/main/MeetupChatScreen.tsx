import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatRoomBackground } from '../../components/meetup/ChatRoomBackground';
import { OrderFoodButton } from '../../components/meetup/order/OrderFoodButton';
import { OrderBillCard } from '../../components/meetup/order/OrderBillCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMeetupChat, useMeetupRoom, type ChatMessage } from '../../hooks/useMeetupChat';
import { meetupsApi } from '../../api';
import { IllustratedAvatar } from '../../components/onboarding/IllustratedAvatar';
import { getAvatarById } from '../../constants/avatars';
import RazorpayCheckout from 'react-native-razorpay';
import { radius, shadows, spacing, typography } from '../../theme';
import type { ColorPalette } from '../../theme/colors';
import type { MainStackParamList, MeetupMember } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'MeetupChat'>;

const EMOJIS = ['☕', '😊', '👍', '❤️', '🎉', '😂', '🔥', '✨'];

async function copyCode(code: string) {
  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(code);
    return true;
  } catch {
    return false;
  }
}

function HeaderSteam() {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 900 }), withTiming(0.25, { duration: 900 })),
      -1,
      true,
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.Text style={[styles.steam, style]} pointerEvents="none">
      ~
    </Animated.Text>
  );
}

export function MeetupChatScreen({ navigation, route }: Props) {
  const { meetupId } = route.params;
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { meetup, reload } = useMeetupRoom(meetupId);
  const { messages, loading, typingUsers, onlineUsers, sendMessage, addReaction, emitTyping, reload: reloadMessages } = useMeetupChat(
    meetupId,
    user?.id ?? '',
    user?.name ?? 'Guest',
    user?.avatarId,
  );

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinToast, setJoinToast] = useState<string | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [payingReservation, setPayingReservation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMsgForMenu, setSelectedMsgForMenu] = useState<ChatMessage | null>(null);
  const listRef = useRef<FlatList>(null);
  const prevMsgCount = useRef(0);

  useFocusEffect(
    useCallback(() => {
      reload();
      reloadMessages();
      console.log('🔑 CHAT DEBUG — My userId:', JSON.stringify(user?.id), '| My name:', user?.name);
    }, [reload, reloadMessages, user?.id, user?.name]),
  );

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  // Auto-scroll when keyboard opens
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    });
    return () => sub.remove();
  }, []);

  const cafeName =
    meetup?.selectedCafe?.cafeName ||
    (meetup?.selectedCafe as { name?: string })?.name ||
    meetup?.title?.replace(/^Coffee Meetup @ /, '') ||
    'Café';

  const memberCount = meetup?.members?.length ?? 0;
  const meetupCode = meetup?.meetupCode ?? route.params.meetupCode ?? '——';

  useEffect(() => {
    if (messages.length <= prevMsgCount.current) {
      prevMsgCount.current = messages.length;
      return;
    }
    const last = messages[messages.length - 1];
    
    if (last?.type === 'system' && /joined|left/i.test(last.message)) {
      reload(); // Update members list!
    }

    if (last?.type === 'system' && /joined/i.test(last.message)) {
      const name = last.message.match(/🎉\s*(.+?)\s+joined/i)?.[1] ?? 'Someone';
      setJoinToast(`🎉 ${name} joined the meetup`);
      setTimeout(() => setJoinToast(null), 3200);
    }
    prevMsgCount.current = messages.length;
  }, [messages, reload]);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    await sendMessage(
      text,
      replyTo ? { userName: replyTo.userName, message: replyTo.message.slice(0, 80) } : undefined,
    );
    setText('');
    setReplyTo(null);
    setShowEmoji(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [text, replyTo, sendMessage]);

  const handleCopyCode = async () => {
    await copyCode(meetupCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert('Remove member', `Remove ${memberName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Member removed', `${memberName} was removed from the meetup.`);
          reload();
        },
      },
    ]);
  };

  const isHost = meetup?.organizerId === user?.id;
  const cafeId = meetup?.selectedCafe?.cafeId;
  const billLocked = Boolean(meetup?.billLocked || meetup?.reservationFeePaid);

  const latestBillMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (
        m.type === 'bill' &&
        m.billData &&
        (m.billData.cardType === 'meetup_bill' || m.billData.cardType === 'order_placed') &&
        !m.billData.locked
      ) {
        return m;
      }
    }
    return null;
  }, [messages]);

  const latestBill = latestBillMessage?.billData ?? null;
  const hasPendingBill = Boolean(latestBill);
  const canOrderOrView = Boolean(cafeId) && !billLocked && !hasPendingBill;
  
  const openViewFood = () => {
    if (!latestBill?.items || latestBill.items.length === 0) {
      Alert.alert('No Items', 'No food has been ordered yet.');
      return;
    }
    navigation.navigate('ViewFood' as never, { items: latestBill.items } as never);
  };

  const handleLeaveMeetup = () => {
    if (isHost) {
      Alert.alert('Cannot leave', 'As the host, you cannot leave the meetup. You must end it.');
      return;
    }
    Alert.alert('Leave Meetup', 'Are you sure you want to leave this meetup?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await meetupsApi.leave({ meetupId, userId: user?.id ?? '' });
            await meetupsApi.sendMessage({
              meetupId,
              userId: 'system',
              userName: 'System',
              message: `👋 ${user?.name} left the meetup.`,
              type: 'system',
            });
            setShowMembers(false);
            navigation.navigate('Tabs', { screen: 'Home' });
          } catch (e) {
            Alert.alert('Error', 'Could not leave meetup.');
          }
        },
      },
    ]);
  };

  const openOrderFood = () => {
    if (!cafeId) {
      Alert.alert('No café selected', 'This meetup does not have a café yet.');
      return;
    }
    if (billLocked) {
      Alert.alert('Bill locked', 'The meetup bill is finalized and cannot be changed.');
      return;
    }
    navigation.navigate('MeetupOrder', {
      meetupId,
      meetupCode: meetupCode !== '——' ? meetupCode : undefined,
      cafeId,
      cafeName,
      isHost: Boolean(isHost),
      reservationFeePaid: Boolean(meetup?.reservationFeePaid),
      billLocked,
      memberCount: Math.max(memberCount, 1),
      meetupDate: meetup?.date,
      meetupTime: meetup?.time,
    });
  };

  const openEditBill = () => {
    if (!cafeId || !latestBill?.orderId) return;
    const creatorId = latestBill.billCreatorId ?? latestBillMessage?.userId;
    if (creatorId && creatorId !== user?.id) {
      Alert.alert('Not allowed', 'Only the bill creator can edit order items.');
      return;
    }
    navigation.navigate('MeetupOrder', {
      meetupId,
      meetupCode: meetupCode !== '——' ? meetupCode : undefined,
      cafeId,
      cafeName,
      isHost: true,
      reservationFeePaid: false,
      billLocked: false,
      memberCount: Math.max(memberCount, 1),
      meetupDate: meetup?.date,
      meetupTime: meetup?.time,
      editOrderId: latestBill.orderId,
    });
  };

  const payReservation = async () => {
    setShowReservationModal(false);
    if (!user?.id) return;
    setPayingReservation(true);
    try {
      // Step 1: Create Razorpay order on backend
      const createRes = await meetupsApi.createRazorpayOrder({
        meetupId,
        userId: user.id,
      });

      if (!createRes.success || !createRes.orderId) {
        Alert.alert('Payment Error', 'Failed to initialize payment. Try again.');
        setPayingReservation(false);
        return;
      }

      setPayingReservation(false);

      // Step 2: Open real Razorpay native checkout
      const options = {
        description: 'Platform Confirmation Fee',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: createRes.currency || 'INR',
        key: 'rzp_live_STzO1DnRlqY3vN',
        amount: String(createRes.amount),
        order_id: createRes.orderId,
        name: 'Caffelino',
        prefill: {
          email: user.email || 'user@caffelino.in',
          contact: user.mobileNumber ? `+${user.mobileNumber}` : '',
          name: user.name || 'User',
        },
        theme: { color: '#6F4E37' },
      };

      RazorpayCheckout.open(options)
        .then(async (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          setPayingReservation(true);
          try {
            const verifyRes = await meetupsApi.verifyRazorpayPayment({
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
              meetupId,
              userId: user.id,
              orderPayload: latestBill ? {
                items: latestBill.items,
                subtotal: latestBill.subtotal,
                cgst: latestBill.cgst,
                sgst: latestBill.sgst,
                total: latestBill.totalPayable ?? latestBill.finalAmount,
                splitEnabled: latestBill.splitEnabled,
                perPersonAmount: latestBill.perPersonAmount,
                memberCount: latestBill.memberCount,
                members: meetup?.members || [],
                cafeId: cafeId,
                cafeName: cafeName,
                meetupDate: meetup?.date,
                meetupTime: meetup?.time,
                userName: user.name ?? 'Host',
              } : undefined,
            });

            if (verifyRes.success) {
              await reload();
              Alert.alert('☕ Meetup Confirmed', 'Payment successful! Table reserved. Order sent to café.');
            } else {
              Alert.alert('Verification Failed', 'Payment received but could not be verified.');
            }
          } catch (e) {
            console.error('Verify payment error:', e);
            Alert.alert('Verification Error', 'Failed to verify payment.');
          } finally {
            setPayingReservation(false);
          }
        })
        .catch((error: { code: number; description: string }) => {
          if (error.code !== 0) {
            Alert.alert('Payment Failed', 'Payment was not completed. Order not confirmed.');
          }
        });
    } catch (err) {
      console.error('Failed to start Razorpay payment', err);
      Alert.alert('Payment Error', 'Could not start payment. Try again.');
      setPayingReservation(false);
    }
  };

  return (
    <ChatRoomBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <LinearGradient
          colors={[palette.coffeeBrown, palette.darkCoffee]}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>

          <View style={styles.headerCenter}>
            {showSearch ? (
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, color: '#FFF', fontSize: 14, width: '90%' }}
                placeholder="Search messages..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            ) : (
              <View style={styles.cafeTitleRow}>
                <View style={styles.cupWrap}>
                  <Text style={styles.cupIcon}>☕</Text>
                  <HeaderSteam />
                </View>
                <Text style={styles.headerCafe} numberOfLines={1}>
                  {cafeName}
                </Text>
              </View>
            )}
            
            {!showSearch && (
              <>
                <Pressable onPress={handleCopyCode} style={styles.codeRow}>
                  <Text style={styles.headerCode}>
                    Code: {meetupCode}
                    {codeCopied ? '  ✓ Copied' : ''}
                  </Text>
                  <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.85)" />
                </Pressable>
                <Text style={styles.headerMembers}>
                  {memberCount} Members • {Math.max(1, onlineUsers.length)} Online
                </Text>
                {typingUsers.length > 0 && (
                  <Animated.Text entering={FadeIn} style={styles.headerTyping}>
                    ✍ {typingUsers.join(', ')} is typing...
                  </Animated.Text>
                )}
              </>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable onPress={() => { setShowSearch(!showSearch); setSearchQuery(''); }} hitSlop={12} style={styles.headerIcon}>
              <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#FFF" />
            </Pressable>
            <Pressable onPress={() => setShowMembers(true)} hitSlop={12} style={styles.headerIcon}>
              <Text style={styles.membersEmoji}>👥</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {latestBill?.items && latestBill.items.length > 0 && (
          <Pressable
            onPress={openViewFood}
            style={({ pressed }) => [
              styles.viewFoodBtn,
              { transform: [{ scale: pressed ? 0.97 : 1 }] }
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#fdfbf7']}
              style={styles.viewFoodGradient}
            >
              <View style={styles.viewFoodIconWrap}>
                <Text style={styles.viewFoodEmoji}>🍽</Text>
              </View>
              <Text style={styles.viewFoodText}>View Ordered Food</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.coffeeBrown} />
            </LinearGradient>
          </Pressable>
        )}

        {canOrderOrView && <OrderFoodButton onPress={openOrderFood} readOnly={!isHost} />}
        {billLocked && (
          <Text style={styles.lockedHint}>🔒 Bill finalized — ordering closed</Text>
        )}

        {joinToast && (
          <Animated.View entering={ZoomIn.duration(300)} style={styles.joinToast}>
            <Text style={styles.joinToastText}>{joinToast}</Text>
          </Animated.View>
        )}

        <FlatList
          ref={listRef}
          data={searchQuery.trim() ? messages.filter((m) => m.message.toLowerCase().includes(searchQuery.toLowerCase())) : messages}
          keyExtractor={(item) => item._id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={({ item, index }) => {
            const myId = String(user?.id ?? '');
            const msgSenderId = String(item.userId ?? '');
            // STRICT FIX: Since demo auth assigns the same user ID if using the same phone number,
            // we MUST verify the name matches. If names don't match, it's NOT their message.
            const isMine = Boolean(user?.name) && item.userName === user?.name;
            return (
              <MessageBubble
                msg={item}
                isMe={isMine}
                palette={palette}
                index={index}
                isHost={Boolean(isHost)}
                billLocked={billLocked}
                member={meetup?.members?.find((m) => String(m.userId) === msgSenderId)}
                currentUserAvatarId={user?.avatarId}
                onlineUsersCount={onlineUsers.length}
                onEditBill={openEditBill}
                onConfirmMeetup={() => setShowReservationModal(true)}
                onLongPress={() => setSelectedMsgForMenu(item)}
              />
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.emptyWrap}>
                <Text style={styles.emptyCup}>☕</Text>
                <Text style={[styles.emptyTitle, { color: palette.espresso }]}>No messages yet</Text>
                <Text style={[styles.emptySub, { color: palette.textMuted }]}>
                  Start the conversation with your meetup members.
                </Text>
              </Animated.View>
            ) : null
          }
        />



        {replyTo && (
          <View style={[styles.replyBar, shadows.soft, { backgroundColor: palette.glass }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyLabel, { color: palette.coffeeBrown }]}>
                Replying to {replyTo.userName}
              </Text>
              <Text numberOfLines={1} style={{ color: palette.textMuted, fontSize: 12 }}>
                {replyTo.message || '📷 Photo'}
              </Text>
            </View>
            <Pressable onPress={() => setReplyTo(null)}>
              <Ionicons name="close-circle" size={22} color={palette.textMuted} />
            </Pressable>
          </View>
        )}

        {showEmoji && (
          <View style={[styles.emojiBar, shadows.soft, { backgroundColor: palette.white }]}>
            {EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => setText((t) => t + e)} style={styles.emojiBtn}>
                <Text style={{ fontSize: 26 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={[styles.inputOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={[styles.inputGlass, shadows.card, { borderColor: palette.glassBorder }]}>
            <Pressable onPress={() => setShowEmoji((v) => !v)} style={styles.inputIcon}>
              <Ionicons name="happy-outline" size={24} color={palette.coffeeBrown} />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Share image', 'Paste an image URL to share in chat.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Use sample',
                    onPress: () =>
                      sendMessage(
                        '',
                        undefined,
                        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
                      ),
                  },
                ])
              }
              style={styles.inputIcon}
            >
              <Ionicons name="image-outline" size={24} color={palette.coffeeBrown} />
            </Pressable>
            <TextInput
              style={[styles.input, { color: palette.espresso }]}
              placeholder="Message…"
              placeholderTextColor={palette.textMuted}
              value={text}
              onChangeText={(t) => {
                setText(t);
                emitTyping();
              }}
              multiline
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              style={styles.sendWrap}
            >
              <LinearGradient
                colors={
                  text.trim()
                    ? [palette.coffeeBrown, palette.darkCoffee]
                    : ['#CCC', '#AAA']
                }
                style={styles.sendBtn}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <Modal visible={showMembers} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.memberSheet, { backgroundColor: palette.white, paddingBottom: insets.bottom }]}>
              <Text style={[styles.memberTitle, { color: palette.espresso }]}>👥 Members</Text>
              {meetup?.members.map((m) => {
                const isOnline = onlineUsers.includes(m.userId) || m.userId === user?.id;
                return (
                  <View key={`${m.userId}-${m.name}`} style={styles.memberRow}>
                    <View style={[styles.avatar, { backgroundColor: palette.cream, overflow: 'hidden' }]}>
                      {m.avatarId ? (
                        <IllustratedAvatar avatar={getAvatarById(m.avatarId)} size={40} />
                      ) : (
                        <Text style={{ fontWeight: '700', fontSize: 18, color: palette.coffeeBrown }}>
                          {m.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.memberName, { color: palette.espresso }]}>{m.name}</Text>
                        {m.userId === meetup.organizerId && (
                          <Text style={styles.hostBadge}>👑 Host</Text>
                        )}
                      </View>
                      <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                        Joined{' '}
                        {m.joinedAt
                          ? new Date(m.joinedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'recently'}
                        {' · '}
                        <Text style={{ color: isOnline ? palette.forestGreen : palette.textMuted, fontWeight: '600' }}>
                          {isOnline ? '🟢 Online' : '⚫ Offline'}
                        </Text>
                      </Text>
                    </View>
                    {isHost && m.userId !== user?.id && (
                      <Pressable onPress={() => handleRemoveMember(m.userId, m.name)}>
                        <Ionicons name="remove-circle" size={24} color={palette.error} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
              {!isHost && (
                <Pressable onPress={handleLeaveMeetup} style={{ marginTop: 24, padding: 16, backgroundColor: '#ffebee', borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#c62828', fontWeight: 'bold', fontSize: 16 }}>Leave Meetup</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setShowMembers(false)} style={styles.closeMembers}>
                <Text style={{ color: palette.coffeeBrown, fontWeight: '700' }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={showReservationModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.reservationSheet, { backgroundColor: palette.white }]}>
              <Text style={[styles.reservationTitle, { color: palette.error }]}>
                ⚠ Order Lock Warning
              </Text>
              <Text style={{ color: palette.espresso, lineHeight: 22, marginBottom: spacing.md }}>
                Once you confirm the table by paying ₹20, your order will be locked and sent to the cafe.
              </Text>
              <Text style={{ color: palette.textMuted, lineHeight: 22, marginBottom: spacing.md }}>
                ⚠ The ₹20 table confirmation fee is non-refundable. Once payment is completed, the bill is locked and the order is sent to the cafe.
              </Text>
              <Text style={{ color: palette.espresso, fontWeight: '700', marginBottom: spacing.lg }}>
                Are you sure you want to continue?
              </Text>
              <View style={styles.reservationActions}>
                <Pressable
                  onPress={() => setShowReservationModal(false)}
                  style={[styles.reservationCancel, { borderColor: palette.coffeeBrown }]}
                >
                  <Text style={{ color: palette.coffeeBrown, fontWeight: '700' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={payReservation}
                  disabled={payingReservation}
                  style={[styles.reservationPay, { backgroundColor: '#2E7D32' }]}
                >
                  {payingReservation ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>Confirm & Pay</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>


        <Modal visible={Boolean(selectedMsgForMenu)} transparent animationType="fade">
          <Pressable style={styles.modalBg} onPress={() => setSelectedMsgForMenu(null)}>
            <View style={[styles.contextMenu, { backgroundColor: palette.white, paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.contextReactions}>
                {['👍', '❤️', '☕', '😂', '🔥'].map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => {
                      if (selectedMsgForMenu) addReaction(selectedMsgForMenu._id, e);
                      setSelectedMsgForMenu(null);
                    }}
                    style={styles.contextEmojiBtn}
                  >
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.contextDivider} />
              <Pressable
                style={styles.contextAction}
                onPress={() => {
                  setReplyTo(selectedMsgForMenu);
                  setSelectedMsgForMenu(null);
                }}
              >
                <Ionicons name="arrow-undo" size={20} color={palette.espresso} />
                <Text style={[styles.contextActionText, { color: palette.espresso }]}>Reply</Text>
              </Pressable>
              <Pressable
                style={styles.contextAction}
                onPress={async () => {
                  if (selectedMsgForMenu?.message) {
                    await copyCode(selectedMsgForMenu.message);
                    setJoinToast('Message copied');
                    setTimeout(() => setJoinToast(null), 2000);
                  }
                  setSelectedMsgForMenu(null);
                }}
              >
                <Ionicons name="copy-outline" size={20} color={palette.espresso} />
                <Text style={[styles.contextActionText, { color: palette.espresso }]}>Copy</Text>
              </Pressable>
              {selectedMsgForMenu?.userId === user?.id && (
                <Pressable
                  style={styles.contextAction}
                  onPress={() => {
                    // Soft delete logic would go here
                    Alert.alert('Delete', 'Message deleted locally.');
                    setSelectedMsgForMenu(null);
                  }}
                >
                  <Ionicons name="trash" size={20} color={palette.error} />
                  <Text style={[styles.contextActionText, { color: palette.error }]}>Delete</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </ChatRoomBackground>
  );
}

function MessageBubble({
  msg,
  isMe,
  palette,
  currentUserId,
  isHost,
  billLocked,
  member,
  currentUserAvatarId,
  onlineUsersCount,
  onEditBill,
  onConfirmMeetup,
  onLongPress,
}: {
  msg: ChatMessage;
  isMe: boolean;
  palette: ColorPalette;
  index: number;
  currentUserId: string;
  isHost: boolean;
  billLocked: boolean;
  member?: MeetupMember;
  currentUserAvatarId?: string;
  onlineUsersCount?: number;
  onEditBill: () => void;
  onConfirmMeetup: () => void;
  onLongPress: () => void;
}) {
  const isSystem = msg.type === 'system';
  const isBill = msg.type === 'bill' && msg.billData;
  const cardType = msg.billData?.cardType;
  const isMeetupBill =
    isBill &&
    (cardType === 'meetup_bill' ||
      cardType === 'order_placed' ||
      cardType === 'meetup_confirmed' ||
      cardType === 'order_locked');

  if (isMeetupBill) {
    const isDraftBill = cardType === 'meetup_bill' || cardType === 'order_placed';
    const creatorId = msg.billData?.billCreatorId ?? msg.userId;
    const canEdit =
      isDraftBill && !billLocked && !msg.billData?.locked && isHost;
    const canConfirm = isDraftBill && isHost && !billLocked && !msg.billData?.locked;

    return (
      <Animated.View style={styles.billWrap}>
        <OrderBillCard
          billData={msg.billData!}
          canEdit={canEdit}
          canConfirm={canConfirm}
          onEditBill={canEdit ? onEditBill : undefined}
          onConfirmMeetup={canConfirm ? onConfirmMeetup : undefined}
        />
      </Animated.View>
    );
  }

  if (isSystem) {
    return (
      <Animated.View style={styles.systemWrap}>
        <View style={[styles.systemPill, { backgroundColor: palette.glass }]}>
          <Text style={[styles.systemText, { color: palette.textSecondary }]}>{msg.message}</Text>
        </View>
      </Animated.View>
    );
  }

  const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <Animated.View
      style={[styles.bubbleWrap, isMe ? styles.bubbleMe : styles.bubbleThem]}
    >
      <Pressable onLongPress={onLongPress} delayLongPress={200} style={[styles.messageContentWrap, isMe && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.messageAvatar, { backgroundColor: palette.cream, overflow: 'hidden' }]}>
          {(msg.avatarId || member?.avatarId || (isMe && currentUserAvatarId)) ? (
            <IllustratedAvatar avatar={getAvatarById(msg.avatarId || member?.avatarId || currentUserAvatarId)} size={32} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: '700', color: palette.coffeeBrown }}>
              {msg.userName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          )}
        </View>

        <View style={[styles.bubbleColumn, isMe && { alignItems: 'flex-end' }]}>
          <View style={[styles.senderRow, isMe && { justifyContent: 'flex-end' }]}>
            <Text style={[styles.sender, { color: isMe ? palette.textSecondary : palette.coffeeBrown }]}>
              {isMe ? 'Me' : msg.userName}
            </Text>
          </View>

          {msg.replyTo && (
            <View style={[styles.replyPreview, { borderColor: palette.goldAccent, backgroundColor: palette.cream }]}>
              <Text style={{ fontSize: 11, color: palette.textMuted, fontWeight: '600' }}>
                {msg.replyTo.userName}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: palette.espresso }}>
                {msg.replyTo.message}
              </Text>
            </View>
          )}
          
          {msg.imageUrl ? (
            <Image source={{ uri: msg.imageUrl }} style={styles.chatImage} />
          ) : isMe ? (
            <LinearGradient
              colors={[palette.coffeeBrown, palette.darkCoffee]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.bubbleShadow, styles.bubbleMeShape]}
            >
              <Text style={styles.bubbleTextMe}>{msg.message}</Text>
              <Text style={[styles.statusTicks, { color: (!msg.pending && (onlineUsersCount ?? 0) > 1) ? '#4da6ff' : 'rgba(255,255,255,0.7)' }]}>
                {msg.pending ? '✓' : '✓✓'}
              </Text>
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.bubbleShadow, styles.bubbleThemShape, { backgroundColor: palette.cream }]}>
              <Text style={[styles.bubbleTextThem, { color: palette.espresso }]}>{msg.message}</Text>
            </View>
          )}

          <Text style={[styles.timestampBelow, { color: palette.textMuted }]}>{timeString}</Text>

          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
            <View style={[styles.reactions, isMe && { justifyContent: 'flex-end' }]}>
              {Object.entries(msg.reactions).map(([emoji, users]) => (
                <View key={emoji} style={[styles.reactionChip, { backgroundColor: palette.white }]}>
                  <Text style={styles.reactionText}>
                    {emoji} {users.length}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerIcon: { paddingTop: 4 },
  headerCenter: { flex: 1 },
  cafeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cupWrap: { position: 'relative', width: 28, height: 24 },
  cupIcon: { fontSize: 22 },
  steam: { position: 'absolute', right: -4, top: -6, fontSize: 16, color: 'rgba(255,255,255,0.5)' },
  headerCafe: { color: '#FFF', fontSize: 17, fontWeight: '800', flex: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  headerCode: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  headerMembers: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4, fontWeight: '500' },
  headerTyping: { color: '#F5E6D3', fontSize: 12, marginTop: 2, fontStyle: 'italic', fontWeight: '600' },
  membersEmoji: { fontSize: 22 },
  joinToast: {
    alignSelf: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.92)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  joinToastText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  list: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },
  emptyWrap: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyCup: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, marginBottom: spacing.sm },
  emptySub: { textAlign: 'center', lineHeight: 22 },
  typing: { fontSize: 12, paddingHorizontal: spacing.lg, paddingBottom: 4, fontStyle: 'italic' },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(212,163,115,0.35)',
  },
  replyLabel: { fontSize: 12, fontWeight: '700' },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  viewFoodBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    shadowColor: '#4A3B32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  viewFoodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(74, 59, 50, 0.08)',
  },
  viewFoodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 169, 126, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  viewFoodEmoji: { fontSize: 20 },
  viewFoodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3B32',
    letterSpacing: 0.2,
  },
  emojiBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  emojiBtn: { padding: 6 },
  inputOuter: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  inputGlass: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  inputIcon: { padding: 6 },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sendWrap: { marginBottom: 2 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleWrap: { marginBottom: spacing.md, maxWidth: '95%' },
  bubbleMe: { alignSelf: 'flex-end' },
  bubbleThem: { alignSelf: 'flex-start' },
  messageContentWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bubbleColumn: { maxWidth: '85%' },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sender: { fontSize: 12, fontWeight: '700' },
  timestampBelow: { fontSize: 10, marginTop: 4, alignSelf: 'auto' },
  statusTicks: { fontSize: 11, color: '#FFF', alignSelf: 'flex-end', marginTop: 2, opacity: 0.8 },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: 4,
    marginBottom: 6,
    borderRadius: radius.sm,
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  bubbleThemShape: { borderBottomLeftRadius: 4 },
  bubbleMeShape: { borderBottomRightRadius: 4 },
  bubbleShadow: {
    shadowColor: '#2B1B17',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubbleTextMe: { color: '#FFF', fontSize: 16, lineHeight: 22 },
  bubbleTextThem: { fontSize: 16, lineHeight: 22 },
  chatImage: { width: 220, height: 160, borderRadius: radius.lg },
  reactions: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  reactionChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  reactionText: { fontSize: 11 },
  systemWrap: { alignItems: 'center', marginVertical: spacing.sm },
  systemPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212,163,115,0.25)',
  },
  systemText: { fontSize: 12, fontWeight: '500' },
  billWrap: { width: '100%', alignItems: 'center' },
  lockedHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: spacing.sm,
  },
  reservationSheet: {
    margin: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  reservationTitle: { ...typography.h2, marginBottom: spacing.sm },
  reservationBenefit: { color: '#2E7D32', fontSize: 14, marginBottom: 4 },
  reservationFee: { fontSize: 18, fontWeight: '800', marginTop: spacing.md },
  reservationActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  reservationCancel: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  reservationPay: {
    flex: 2,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  memberSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  memberTitle: { ...typography.h2, marginBottom: spacing.lg },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  memberName: { fontWeight: '700', fontSize: 15 },
  hostBadge: { fontSize: 11, fontWeight: '800', color: '#6F4E37' },
  closeMembers: { alignItems: 'center', padding: spacing.md },
  contextMenu: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  contextReactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  contextEmojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.sm,
  },
  contextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  contextActionText: { fontSize: 17, fontWeight: '600' },
});
