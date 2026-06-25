import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  ToastAndroid,
  Platform,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { meetupsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import { radius, shadows, spacing, typography } from '../../theme';
import type { CafeMenuItem, CartLine, MainStackParamList } from '../../types';
import {
  getAmountNeeded,
  getMinimumOrderAmount,
  meetsMinimumOrder,
} from '../../utils/cafeMinimumOrder';
import { computeBill, formatRupee, perPersonEqual } from '../../utils/orderBilling';

interface AvailableCoupon {
  code: string;
  description: string;
  discountValue: number;
  discountType: 'flat' | 'percent';
  effectiveMinOrder: number;
}

type Props = NativeStackScreenProps<MainStackParamList, 'MeetupOrder'>;

const FILTERS = [
  'Show All',
  'Coffee',
  'Beverages',
  'Desserts',
  'Snacks',
  'Pizza',
  'Burgers',
  'Pasta',
  'Sandwiches',
  'Specials',
];

type Step = 'menu' | 'checkout';

export function MeetupOrderScreen({ navigation, route }: Props) {
  const {
    meetupId,
    meetupCode,
    cafeId,
    cafeName,
    isHost,
    reservationFeePaid: initialReservationPaid,
    billLocked: initialBillLocked,
    memberCount,
    meetupDate,
    meetupTime,
    editOrderId,
  } = route.params;
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('menu');
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<CafeMenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Show All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [orderId, setOrderId] = useState(editOrderId ?? '');
  const [splitBillEnabled, setSplitBillEnabled] = useState(true);
  const [placing, setPlacing] = useState(false);
  const readOnly = !isHost || initialBillLocked || initialReservationPaid;

  const loadMenuAndCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const [menuRes, couponsRes] = await Promise.all([
        meetupsApi.getCafeMenu(meetupId).catch(() => ({ menuItems: [] })),
        meetupsApi.getAvailableCoupons(cafeName).catch(() => ({ coupons: [] }))
      ]);
      setMenuItems(menuRes.menuItems ?? []);
      setAvailableCoupons(couponsRes.coupons ?? []);
    } catch {
      Alert.alert('Data unavailable', 'Could not load the menu or offers. Try again later.');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, [meetupId, cafeName]);

  useEffect(() => {
    loadMenuAndCoupons();
  }, [loadMenuAndCoupons]);

  useEffect(() => {
    if (!editOrderId || readOnly) return;
    (async () => {
      try {
        const res = await meetupsApi.getOrders(meetupId);
        const order = res.orders?.find((o) => o.orderId === editOrderId);
        if (!order) return;
        setOrderId(order.orderId);
        setCart(
          order.items.map((i) => ({
            menuItemId: (i as CartLine).menuItemId || i.name,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        );
        setSplitBillEnabled((order as { splitEnabled?: boolean }).splitEnabled !== false);
        setStep('checkout');
      } catch {
        /* ignore */
      }
    })();
  }, [editOrderId, meetupId, readOnly]);

  const filteredMenu = useMemo(() => {
    let list = menuItems;
    if (filter !== 'Show All') {
      list = list.filter(
        (m) =>
          (m.category ?? '').toLowerCase().includes(filter.toLowerCase()) ||
          m.name.toLowerCase().includes(filter.toLowerCase()),
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.description ?? '').toLowerCase().includes(q) ||
          (m.category ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [menuItems, filter, search]);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const minimumOrder = getMinimumOrderAmount(cafeName);
  const amountNeeded = getAmountNeeded(subtotal, minimumOrder);
  const minOrderMet = meetsMinimumOrder(subtotal, cafeName);
  const progress = Math.min(1, minimumOrder > 0 ? subtotal / minimumOrder : 1);
  
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const c = availableCoupons.find(x => x.code === appliedCoupon);
    if (!c || subtotal < c.effectiveMinOrder) return 0;
    const val = c.discountType === 'percent' ? (subtotal * c.discountValue) / 100 : c.discountValue;
    return Math.min(val, subtotal);
  }, [appliedCoupon, subtotal, availableCoupons]);

  const bill = computeBill(subtotal, couponDiscount);
  const perPerson = splitBillEnabled
    ? perPersonEqual(bill.finalAmount, memberCount)
    : bill.finalAmount;

  const addToCart = (item: CafeMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
          category: item.category,
          isVeg: item.isVeg,
          description: item.description,
        },
      ];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.menuItemId === menuItemId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
  };

  const applyCoupon = (code: string) => {
    if (readOnly) return;
    setAppliedCoupon(code);
  };

  const handlePostBillToChat = async () => {
    if (!user?.id || cart.length === 0) return;
    if (!user.isVerified) {
      Alert.alert('Verification Required', 'You must verify your profile with a phone number to place orders.');
      return;
    }
    if (!isHost) {
      Alert.alert('Host only', 'Only the meetup host can create or edit the bill.');
      return;
    }
    if (readOnly) {
      Alert.alert('Bill locked', 'This bill can no longer be edited after confirmation.');
      return;
    }
    if (!minOrderMet) {
      Alert.alert(
        'Minimum order',
        `Minimum order for this meetup is ₹${minimumOrder}. Add items worth ₹${amountNeeded} more.`,
      );
      return;
    }
    setPlacing(true);
    try {
      const newOrderId = orderId || `ORD_${meetupId.slice(-6)}_${Date.now()}`;
      const res = await meetupsApi.placeOrder({
        meetupId,
        userId: user.id,
        userName: user.name ?? 'Host',
        items: cart as CartLine[],
        subtotal: bill.subtotal,
        cgst: bill.cgst,
        sgst: bill.sgst,
        total: bill.finalAmount,
        finalAmount: bill.finalAmount,
        status: 'PENDING',
        cafeId,
        couponCode: appliedCoupon,
        couponDiscount: bill.couponDiscount,
        splitEnabled: splitBillEnabled,
        perPersonAmount: perPerson,
        memberCount,
        meetupDate,
        meetupTime,
        postBillToChat: true,
        orderId: newOrderId,
      });
      const savedOrderId = res.order?.orderId ?? newOrderId;
      setOrderId(savedOrderId);

      // Post bill card to group chat
      await meetupsApi.sendMessage({
        meetupId,
        userId: user.id,
        userName: user.name ?? 'Host',
        message: 'Bill generated',
        type: 'bill',
        billData: {
          cardType: 'meetup_bill',
          orderId: savedOrderId,
          items: cart,
          subtotal: bill.subtotal,
          cgst: bill.cgst,
          sgst: bill.sgst,
          totalPayable: bill.finalAmount,
          finalAmount: bill.finalAmount,
          memberCount,
          splitEnabled: splitBillEnabled,
          perPersonAmount: perPerson,
          locked: false,
          billStatus: 'awaiting_payment',
          billCreatorId: user.id,
        },
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show('✅ Bill posted to group chat!', ToastAndroid.SHORT);
      }
      navigation.navigate('MeetupChat', { meetupId });
    } catch (e) {
      console.error('Post bill error:', e);
      if (Platform.OS === 'android') {
        ToastAndroid.show('⚠ Could not post bill. Try again.', ToastAndroid.LONG);
      } else {
        Alert.alert('Error', '⚠ Could not post bill. Try again.');
      }
    } finally {
      setPlacing(false);
    }
  };

  const renderMenuItem = ({ item }: { item: CafeMenuItem }) => {
    const line = cart.find((l) => l.menuItemId === item.id);
    const qty = line?.quantity ?? 0;
    return (
      <View style={[styles.menuCard, shadows.soft, { backgroundColor: palette.white }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.menuImage} />
        ) : (
          <View style={[styles.menuImage, styles.menuPlaceholder, { backgroundColor: palette.cream }]}>
            <Text style={{ fontSize: 32 }}>☕</Text>
          </View>
        )}
        <View style={styles.menuBody}>
          <View style={styles.menuTitleRow}>
            <Text style={[styles.menuName, { color: palette.espresso }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.vegBadge}>{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</Text>
          </View>
          {item.description ? (
            <Text style={[styles.menuDesc, { color: palette.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.menuCat, { color: palette.coffeeBrown }]}>{item.category || '—'}</Text>
          <View style={styles.menuFooter}>
            <Text style={[styles.menuPrice, { color: palette.espresso }]}>
              {formatRupee(item.price)}
            </Text>
            <Text style={[styles.avail, { color: palette.forestGreen }]}>Available</Text>
          </View>
          {qty > 0 && !readOnly ? (
            <View style={styles.qtyRow}>
              <Pressable onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                <Ionicons name="remove" size={18} color={palette.coffeeBrown} />
              </Pressable>
              <Text style={styles.qtyText}>{qty}</Text>
              <Pressable onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                <Ionicons name="add" size={18} color={palette.coffeeBrown} />
              </Pressable>
            </View>
          ) : qty > 0 ? (
            <Text style={[styles.qtyText, { marginTop: spacing.xs }]}>Qty: {qty}</Text>
          ) : !readOnly ? (
            <Pressable onPress={() => addToCart(item)} style={styles.addBtn}>
              <LinearGradient
                colors={[palette.coffeeBrown, palette.darkCoffee]}
                style={styles.addBtnGrad}
              >
                <Text style={styles.addBtnText}>Add To Cart</Text>
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  if (step === 'checkout') {
    return (
      <View style={[styles.flex, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
        <CheckoutHeader
          title="Your Cart"
          onBack={() => setStep('menu')}
          palette={palette}
        />
        <ScrollView contentContainerStyle={styles.checkoutContent}>
          {cart.map((line) => (
            <View key={line.menuItemId} style={[styles.cartRow, { backgroundColor: palette.white }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cartName, { color: palette.espresso }]}>{line.name}</Text>
                <Text style={{ color: palette.textMuted }}>
                  {formatRupee(line.price)} × {line.quantity}
                </Text>
              </View>
              <Text style={[styles.cartLineTotal, { color: palette.espresso }]}>
                {formatRupee(line.price * line.quantity)}
              </Text>
              {!readOnly ? (
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => updateQty(line.menuItemId, -1)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={16} color={palette.coffeeBrown} />
                  </Pressable>
                  <Text>{line.quantity}</Text>
                  <Pressable onPress={() => updateQty(line.menuItemId, 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={16} color={palette.coffeeBrown} />
                  </Pressable>
                </View>
              ) : (
                <Text style={{ color: palette.textMuted }}>×{line.quantity}</Text>
              )}
            </View>
          ))}

          {!readOnly && !minOrderMet && subtotal > 0 && (
            <MinimumOrderCard
              minimum={minimumOrder}
              subtotal={subtotal}
              amountNeeded={amountNeeded}
              progress={progress}
            />
          )}

          {!readOnly && availableCoupons.length > 0 && (
            <View style={[styles.couponBox, { backgroundColor: palette.white, paddingVertical: 16 }]}>
              <Text style={[styles.sectionTitle, { color: palette.espresso, marginLeft: 16 }]}>
                🎟 Available Offers
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {availableCoupons.map((coupon, idx) => {
                  const isEligible = subtotal >= coupon.effectiveMinOrder;
                  const isApplied = appliedCoupon === coupon.code;
                  
                  let potentialDiscount = coupon.discountType === 'percent' ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
                  potentialDiscount = Math.min(potentialDiscount, subtotal);

                  return (
                    <Pressable
                      key={coupon.code}
                      onPress={() => isEligible ? (isApplied ? removeCoupon() : applyCoupon(coupon.code)) : null}
                      style={[
                        styles.offerCard,
                        { borderColor: isApplied ? palette.forestGreen : palette.border },
                        !isEligible && { opacity: 0.7 }
                      ]}
                    >
                      {idx === 0 && isEligible && (
                        <View style={styles.bestDealBadge}>
                          <Text style={styles.bestDealText}>Best Deal</Text>
                        </View>
                      )}
                      <Text style={[styles.offerCode, { color: palette.espresso }]}>{coupon.code}</Text>
                      <Text style={styles.offerDesc}>{coupon.description}</Text>
                      <Text style={styles.offerMin}>Min order ₹{coupon.effectiveMinOrder}</Text>
                      
                      {isEligible ? (
                        <View style={styles.offerActionRow}>
                          <Text style={[styles.offerSavings, { color: palette.forestGreen }]}>
                            Save {formatRupee(potentialDiscount)}
                          </Text>
                          <Text style={[styles.offerTapToApply, { color: isApplied ? palette.forestGreen : palette.coffeeBrown }]}>
                            {isApplied ? 'Applied ✓' : 'Tap to Apply'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.offerActionRow}>
                          <Text style={[styles.offerLocked, { color: palette.error }]}>
                            Add {formatRupee(coupon.effectiveMinOrder - subtotal)} more
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <BillSummary
            bill={bill}
            palette={palette}
            splitBillEnabled={splitBillEnabled}
            onSplitChange={setSplitBillEnabled}
            perPerson={perPerson}
            memberCount={memberCount}
            readOnly={readOnly}
          />

          <View style={[styles.warnBox, { backgroundColor: palette.cream }]}>
            <Text style={[styles.warnText, { color: palette.espresso }]}>
              ⚠ Once you confirm the table (₹20), your order will be locked and cannot be edited.
              This amount is non-refundable.
            </Text>
          </View>

          {!readOnly && isHost && (
            <Pressable
              onPress={handlePostBillToChat}
              disabled={placing || cart.length === 0 || !minOrderMet}
              style={[styles.placeWrap, !minOrderMet && styles.placeDisabled]}
            >
              <LinearGradient
                colors={
                  minOrderMet
                    ? [palette.coffeeBrown, palette.darkCoffee]
                    : ['#AAA', '#888']
                }
                style={styles.placeBtn}
              >
                {placing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.placeBtnText}>📋 Post Bill to Chat</Text>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  if (step === 'summary') {
    return (
      <View style={[styles.flex, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
        <CheckoutHeader
          title="Order Summary"
          onBack={() => setStep('checkout')}
          palette={palette}
        />
        <ScrollView contentContainerStyle={styles.checkoutContent}>
          <Text style={[styles.sectionTitle, { color: palette.espresso }]}>Review Your Items</Text>
          {cart.map((line) => (
            <View key={line.menuItemId} style={[styles.cartRow, { backgroundColor: palette.white }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cartName, { color: palette.espresso }]}>{line.name}</Text>
                <Text style={{ color: palette.textMuted }}>
                  {formatRupee(line.price)} × {line.quantity}
                </Text>
              </View>
              <Text style={[styles.cartLineTotal, { color: palette.espresso }]}>
                {formatRupee(line.price * line.quantity)}
              </Text>
            </View>
          ))}

          <View style={[styles.summary, { backgroundColor: '#FFF', marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { color: palette.espresso }]}>Bill Breakdown</Text>
            <SummaryRow label="Subtotal" value={formatRupee(bill.subtotal)} />
            <SummaryRow label="CGST (2.5%)" value={formatRupee(bill.cgst)} />
            <SummaryRow label="SGST (2.5%)" value={formatRupee(bill.sgst)} />
            {bill.couponDiscount > 0 && (
              <SummaryRow label="Coupon Discount" value={`-${formatRupee(bill.couponDiscount)}`} accent />
            )}
            <View style={{ height: 1, backgroundColor: 'rgba(111,78,55,0.12)', marginVertical: 8 }} />
            <SummaryRow label="Platform Confirmation Fee" value="₹20" bold accent />
            <View style={{ height: 1, backgroundColor: 'rgba(111,78,55,0.12)', marginVertical: 8 }} />
            <SummaryRow label="Total Payable (Later at Café)" value={formatRupee(bill.finalAmount)} bold />
            <SummaryRow label="Amount to Pay Now" value="₹20" bold accent />
          </View>

          <View style={[styles.warnBox, { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9', marginTop: 16 }]}>
            <Text style={[styles.warnText, { color: '#2E7D32' }]}>
              ℹ A platform confirmation fee of ₹20 is charged to confirm and lock this order. This fee is non-refundable. You will pay the remaining food bill at the café.
            </Text>
          </View>

          <Pressable
            onPress={handlePayAndConfirmOrder}
            disabled={placing}
            style={[styles.placeWrap, { marginTop: 24 }]}
          >
            <LinearGradient
              colors={[palette.coffeeBrown, palette.darkCoffee]}
              style={styles.placeBtn}
            >
              {placing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.placeBtnText}>Pay ₹20 & Confirm Order</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>

      </View>
    );
  }

  if (step === 'success') {
    return (
      <View style={[styles.flex, { backgroundColor: palette.warmCream, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', width: '100%' }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="checkmark-circle" size={80} color="#2E7D32" />
          </View>

          <Text style={{ fontSize: 26, fontWeight: '800', color: palette.espresso, textAlign: 'center', marginBottom: 12 }}>
            Order Confirmed! 🎉
          </Text>
          <Text style={{ fontSize: 15, color: palette.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            Your order has been verified and successfully sent to the café dashboard.
          </Text>

          <View style={{ width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(111,78,55,0.08)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: palette.textMuted, fontWeight: '500' }}>Order ID</Text>
              <Text style={{ color: palette.espresso, fontWeight: '700' }}>
                {(() => {
                  if (!orderId) return '—';
                  const rawId = String(orderId);
                  return rawId.includes('_') && rawId.split('_').length >= 2 
                    ? rawId.split('_')[1].slice(-6).toUpperCase() 
                    : rawId.slice(-6).toUpperCase();
                })()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: palette.textMuted, fontWeight: '500' }}>Transaction ID</Text>
              <Text style={{ color: palette.espresso, fontWeight: '600' }}>{transactionId || '—'}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(111,78,55,0.08)', marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: palette.textMuted, fontWeight: '500' }}>Platform Fee Paid</Text>
              <Text style={{ color: '#2E7D32', fontWeight: '700' }}>₹20</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: palette.textMuted, fontWeight: '500' }}>To Pay at Café</Text>
              <Text style={{ color: palette.espresso, fontWeight: '800' }}>{formatRupee(bill.finalAmount)}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('MeetupChat', { meetupId })}
            style={{ width: '100%', borderRadius: 28, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[palette.coffeeBrown, palette.darkCoffee]}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Go to Meetup Chat</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.warmCream, paddingTop: insets.top }]}>
      <CheckoutHeader title={cafeName} subtitle="Menu" onBack={() => navigation.goBack()} palette={palette} />

      <View style={[styles.searchWrap, { backgroundColor: palette.white }]}>
        <Ionicons name="search" size={20} color={palette.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: palette.espresso }]}
          placeholder="Search Menu..."
          placeholderTextColor={palette.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {readOnly && !initialBillLocked && !initialReservationPaid && (
        <View style={{ backgroundColor: 'rgba(111,78,55,0.1)', padding: 12, marginHorizontal: 16, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ color: palette.espresso, fontSize: 13, fontWeight: '600' }}>
            ☕ Only the meetup host can place and manage food orders. You can view the menu but cannot modify the order.
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f && { backgroundColor: palette.coffeeBrown },
              { borderColor: palette.border },
            ]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={palette.coffeeBrown} />
      ) : (
        <FlatList
          data={filteredMenu}
          keyExtractor={(item) => item.id}
          renderItem={renderMenuItem}
          contentContainerStyle={styles.listPad}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: palette.textMuted }]}>No menu items found.</Text>
          }
        />
      )}

      {cartCount > 0 && !readOnly && (
        <Pressable
          onPress={() => setStep('checkout')}
          style={[styles.stickyCart, shadows.card, { bottom: insets.bottom + spacing.md }]}
        >
          <LinearGradient colors={[palette.coffeeBrown, palette.darkCoffee]} style={styles.stickyCartGrad}>
            <Ionicons name="cart" size={22} color="#FFF" />
            <Text style={styles.stickyCartText}>Cart ({cartCount})</Text>
            <Text style={styles.stickyCartAmount}>{formatRupee(subtotal)}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

function CheckoutHeader({
  title,
  subtitle,
  onBack,
  palette,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  palette: { espresso: string; coffeeBrown: string };
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={palette.espresso} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: palette.espresso }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: palette.coffeeBrown, fontSize: 12 }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function MinimumOrderCard({
  minimum,
  subtotal,
  amountNeeded,
  progress,
}: {
  minimum: number;
  subtotal: number;
  amountNeeded: number;
  progress: number;
}) {
  return (
    <View style={styles.minCard}>
      <Text style={styles.minTitle}>
        ⚠ Minimum order for this meetup is ₹{minimum}
      </Text>
      <Text style={styles.minSub}>
        Add items worth ₹{amountNeeded.toFixed(2)} more to continue
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.minProgress}>
        {formatRupee(subtotal)} / {formatRupee(minimum)}
      </Text>
    </View>
  );
}

function BillSummary({
  bill,
  palette,
  splitBillEnabled,
  onSplitChange,
  perPerson,
  memberCount,
  readOnly,
}: {
  bill: ReturnType<typeof computeBill>;
  palette: { espresso: string; textMuted: string; coffeeBrown: string };
  splitBillEnabled: boolean;
  onSplitChange: (v: boolean) => void;
  perPerson: number;
  memberCount: number;
  readOnly: boolean;
}) {
  return (
    <View style={[styles.summary, { backgroundColor: '#FFF' }]}>
      <Text style={[styles.sectionTitle, { color: palette.espresso }]}>Bill Summary</Text>
      <SummaryRow label="Subtotal" value={formatRupee(bill.subtotal)} />
      <SummaryRow label="CGST (2.5%)" value={formatRupee(bill.cgst)} />
      <SummaryRow label="SGST (2.5%)" value={formatRupee(bill.sgst)} />
      {bill.couponDiscount > 0 && (
        <SummaryRow label="Coupon Discount" value={`-${formatRupee(bill.couponDiscount)}`} accent />
      )}
      <SummaryRow label="Total Payable" value={formatRupee(bill.finalAmount)} bold />

      <View style={styles.splitRow}>
        <Text style={[styles.splitLabel, { color: palette.espresso }]}>👥 Split Bill</Text>
        <Switch
          value={splitBillEnabled}
          onValueChange={onSplitChange}
          disabled={readOnly}
          trackColor={{ false: '#CCC', true: palette.coffeeBrown }}
          thumbColor="#FFF"
        />
      </View>
      {splitBillEnabled ? (
        <SummaryRow
          label={`Each member (${memberCount})`}
          value={formatRupee(perPerson)}
          bold
        />
      ) : (
        <SummaryRow label="Host pays full" value={formatRupee(bill.finalAmount)} bold />
      )}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: accent ? '#2E7D32' : '#6F4E37', fontWeight: bold ? '800' : '500' }}>
        {label}
      </Text>
      <Text style={{ fontWeight: bold ? '800' : '600', color: accent ? '#2E7D32' : '#2B1B17' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerTitle: { ...typography.h3, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 2, fontSize: 16 },
  filtersScroll: { maxHeight: 44, marginBottom: spacing.sm, paddingLeft: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    backgroundColor: '#FFF',
  },
  filterText: { fontSize: 13, color: '#6F4E37', fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  listPad: { padding: spacing.md, paddingBottom: 120 },
  menuCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuImage: { width: 100, height: 100 },
  menuPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  menuBody: { flex: 1, padding: spacing.sm },
  menuTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  menuName: { fontSize: 15, fontWeight: '700', flex: 1 },
  vegBadge: { fontSize: 10, fontWeight: '700' },
  menuDesc: { fontSize: 12, marginTop: 2 },
  menuCat: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  menuFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  menuPrice: { fontSize: 16, fontWeight: '800' },
  avail: { fontSize: 11, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(111,78,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontWeight: '700', minWidth: 24, textAlign: 'center' },
  addBtn: { marginTop: spacing.xs },
  addBtnGrad: { paddingVertical: spacing.xs, borderRadius: radius.md, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  stickyCart: {
    position: 'absolute',
    right: spacing.md,
    left: spacing.md,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  stickyCartGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stickyCartText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  stickyCartAmount: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  checkoutContent: { padding: spacing.md, paddingBottom: 40 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cartName: { fontWeight: '700', fontSize: 15 },
  cartLineTotal: { fontWeight: '800' },
  couponBox: { borderRadius: radius.lg, marginVertical: spacing.sm },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginBottom: spacing.sm },
  offerCard: {
    width: 280,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#FAFAFA',
    position: 'relative'
  },
  bestDealBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestDealText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8B6508'
  },
  offerCode: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  offerDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  offerMin: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  offerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
  },
  offerSavings: {
    fontSize: 13,
    fontWeight: '700',
  },
  offerTapToApply: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  offerLocked: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  minCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  minTitle: { fontWeight: '800', color: '#E65100', fontSize: 14 },
  minSub: { color: '#6F4E37', marginTop: 4, fontSize: 13 },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(111,78,55,0.15)',
    borderRadius: 4,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#6F4E37', borderRadius: 4 },
  minProgress: { marginTop: 6, fontWeight: '700', color: '#3E2723', fontSize: 13 },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(111,78,55,0.12)',
  },
  splitLabel: { fontWeight: '700', fontSize: 15 },
  placeDisabled: { opacity: 0.65 },
  summary: { padding: spacing.md, borderRadius: radius.lg, marginVertical: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  placeWrap: { marginTop: spacing.md, borderRadius: radius.full, overflow: 'hidden' },
  placeBtn: { paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.full },
  placeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  warnBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(111,78,55,0.2)',
  },
  warnText: { fontSize: 13, lineHeight: 20, fontWeight: '600' },
});
