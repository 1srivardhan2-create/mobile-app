import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface RazorpaySimulatorProps {
  visible: boolean;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RazorpaySimulator({ visible, amount, onSuccess, onCancel }: RazorpaySimulatorProps) {
  const insets = useSafeAreaInsets();
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Razorpay Simulator</Text>
            <Pressable onPress={onCancel} disabled={processing}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Table Confirmation Fee</Text>
            <Text style={styles.amountValue}>₹{amount}</Text>
          </View>

          <Text style={styles.subTitle}>Select Payment Method</Text>

          <View style={styles.methods}>
            <PaymentMethod icon="logo-google" label="Google Pay" onPress={handlePay} disabled={processing} />
            <PaymentMethod icon="card-outline" label="Credit/Debit Card" onPress={handlePay} disabled={processing} />
            <PaymentMethod icon="phone-portrait-outline" label="UPI" onPress={handlePay} disabled={processing} />
          </View>

          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#4A3B32" />
              <Text style={styles.processingText}>Processing Payment...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function PaymentMethod({ icon, label, onPress, disabled }: { icon: any; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable style={styles.methodBtn} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={24} color="#4A3B32" />
      <Text style={styles.methodLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4A3B32',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  methods: {
    gap: 12,
  },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  methodLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    zIndex: 10,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3B32',
  },
});
