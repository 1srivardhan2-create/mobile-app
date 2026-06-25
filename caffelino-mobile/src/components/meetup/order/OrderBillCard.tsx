import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MeetupBillData } from '../../../types';
import { formatRupee } from '../../../utils/orderBilling';
import { radius, spacing } from '../../../theme';

interface Props {
  billData: MeetupBillData;
  canEdit?: boolean;
  canConfirm?: boolean;
  onEditBill?: () => void;
  onConfirmMeetup?: () => void;
}

export function OrderBillCard({
  billData,
  canEdit,
  canConfirm,
  onEditBill,
  onConfirmMeetup,
}: Props) {
  if (billData.cardType === 'meetup_confirmed') {
    return (
      <View style={styles.wrap}>
        <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.card}>
          <Text style={styles.title}>☕ Order Confirmed</Text>
          <Text style={styles.subtitle}>🎉 Meetup Confirmed</Text>
          <View style={styles.divider} />
          <Bullet text="Food Order Sent To Cafe" />
        </LinearGradient>
      </View>
    );
  }

  if (billData.cardType === 'order_locked') {
    return (
      <View style={styles.wrap}>
        <View style={styles.lockCard}>
          <Text style={styles.lockTitle}>🔒 Order Locked</Text>
          <Text style={styles.lockBody}>
            Order has been confirmed.{'\n'}
            Food order has been sent to the cafe.{'\n'}
            No edits are allowed.
          </Text>
          <Text style={styles.lockRefund}>
            ₹20 confirmation fee is non-refundable. No refund, cancellation, or bill changes after
            payment.
          </Text>
        </View>
      </View>
    );
  }

  const locked = billData.locked === true || billData.billStatus === 'locked';
  const isBill =
    billData.cardType === 'meetup_bill' || 
    billData.cardType === 'order_placed' ||
    Boolean(billData.orderId);

  if (!isBill) return null;

  const rawId = String(billData.displayOrderId || billData.orderId || '');
  const displayId = rawId.includes('_') && rawId.split('_').length >= 2 
    ? rawId.split('_')[1].slice(-6).toUpperCase() 
    : rawId.slice(-6).toUpperCase() || '------';
  const total = billData.totalPayable ?? billData.finalAmount ?? 0;
  const splitOn = billData.splitEnabled === true;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={locked ? ['#5D4037', '#3E2723'] : ['#4E342E', '#6F4E37']}
        style={styles.card}
      >
        <Text style={styles.title}>📄 BILL GENERATED</Text>
        <Text style={styles.orderIdLine}>Order ID: {displayId}</Text>
        <View style={styles.divider} />
        <Text style={styles.section}>Items</Text>
        {(billData.items ?? []).map((item, i) => (
          <Text key={`${item.name}-${i}`} style={styles.itemLine}>
            {item.name} ×{item.quantity}
          </Text>
        ))}
        <View style={styles.divider} />
        <Row label="Subtotal" value={formatRupee(billData.subtotal ?? 0)} />
        <Row label="CGST" value={formatRupee(billData.cgst ?? 0)} />
        <Row label="SGST" value={formatRupee(billData.sgst ?? 0)} />
        {billData.coupon ? <Row label="Coupon" value={billData.coupon} accent /> : null}
        {(billData.couponDiscount ?? 0) > 0 && (
          <Row label="Coupon Discount" value={`-${formatRupee(billData.couponDiscount!)}`} accent />
        )}
        <Row label="Total Payable" value={formatRupee(total)} bold />
        <Row label="Split Bill" value={splitOn ? 'Enabled' : 'Disabled'} />
        {splitOn ? (
          <>
            <Row label="Members" value={String(billData.memberCount ?? '—')} />
            <Row label="Per Member" value={formatRupee(billData.perPersonAmount ?? 0)} bold />
          </>
        ) : (
          <Row label="Host Pays" value={formatRupee(billData.hostPaysAmount ?? total)} bold />
        )}
        <Text style={styles.statusPill}>
          {locked ? '🔒 Order Confirmed' : '⏳ Awaiting Confirmation'}
        </Text>

        {canEdit && !locked && onEditBill && (
          <Pressable onPress={onEditBill} style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️ Edit Order Items</Text>
          </Pressable>
        )}

        {canConfirm && !locked && onConfirmMeetup && (
          <Pressable onPress={onConfirmMeetup} style={styles.confirmGreen}>
            <Text style={styles.confirmGreenText}>💳 Pay ₹20 & Confirm Order</Text>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return <Text style={styles.bullet}>✅ {text}</Text>;
}

function Row({
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
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold, accent && styles.accent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: spacing.sm, width: '100%' },
  card: {
    width: '94%',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212,163,115,0.45)',
  },
  title: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  orderIdLine: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: spacing.sm,
  },
  section: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  itemLine: { color: '#FFF', fontSize: 14, marginBottom: 3 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: spacing.sm,
  },
  rowLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 13, flex: 1 },
  rowValue: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  bold: { fontWeight: '800', fontSize: 15 },
  accent: { color: '#D4A373' },
  statusPill: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  editBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  editBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  confirmGreen: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    shadowColor: '#1B5E20',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmGreenText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  bullet: { color: '#FFF', fontSize: 14, marginBottom: 6, fontWeight: '600' },
  lockCard: {
    width: '94%',
    backgroundColor: '#FFF8F0',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#C62828',
  },
  lockTitle: { fontSize: 16, fontWeight: '800', color: '#C62828', marginBottom: spacing.sm },
  lockBody: { fontSize: 14, color: '#3E2723', lineHeight: 22 },
  lockRefund: {
    fontSize: 12,
    color: '#6F4E37',
    marginTop: spacing.sm,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
