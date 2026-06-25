import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config/env';
import { spacing, typography, radius } from '../../theme';

export function AttendanceScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Pressable onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    setLoading(true);
    try {
      // Expecting qrCodeData JSON containing ticketNumber, or just the ticketNumber string directly
      let ticketNumber = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.ticketNumber) {
          ticketNumber = parsed.ticketNumber;
        }
      } catch (e) {
        // Not a JSON string, assume it's just the ticket number
      }

      console.log('Scanned ticket:', ticketNumber);

      const res = await axios.post(`${API_BASE_URL}/api/events/scan-ticket`, {
        ticketNumber
      });

      if (res.data.success) {
        setScanResult(res.data.registration);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to scan ticket';
      Alert.alert('❌ Error', msg, [
        { text: 'Scan Another', onPress: () => { setScanned(false); setScanResult(null); } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.overlay}>
        <View style={styles.scannerFrame}>
          {loading && <ActivityIndicator size="large" color="#FFF" style={StyleSheet.absoluteFillObject} />}
        </View>
        <Text style={styles.scanInstruction}>Align QR code within the frame</Text>
      </View>

      {scanned && !loading && !scanResult && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable style={styles.rescanBtn} onPress={() => { setScanned(false); setScanResult(null); }}>
            <Text style={styles.rescanText}>Tap to Scan Again</Text>
          </Pressable>
        </View>
      )}

      {scanResult && (
        <View style={styles.resultCard}>
          <Ionicons name="checkmark-circle" size={56} color="#4CAF50" style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.resultTitle}>Check-in Successful!</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Event</Text>
            <Text style={styles.resultValue}>{scanResult.eventId?.eventName || scanResult.eventName || 'N/A'}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Ticket</Text>
            <Text style={styles.resultValue}>{scanResult.ticketNumber}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Name</Text>
            <Text style={styles.resultValue}>{scanResult.userName || 'N/A'}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Mobile</Text>
            <Text style={styles.resultValue}>{scanResult.mobileNumber || 'N/A'}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Email</Text>
            <Text style={styles.resultValue}>{scanResult.email || 'N/A'}</Text>
          </View>

          <Pressable style={[styles.rescanBtn, { marginTop: 20, width: '100%', backgroundColor: '#C8A97E' }]} onPress={() => { setScanned(false); setScanResult(null); }}>
            <Text style={[styles.rescanText, { textAlign: 'center' }]}>Scan Another</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  text: { color: '#FFF', fontSize: 16, marginBottom: spacing.lg },
  btn: { backgroundColor: '#C8A97E', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 10
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { color: '#FFF', ...typography.h2, fontSize: 18 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250, height: 250,
    borderWidth: 2, borderColor: '#C8A97E',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center'
  },
  scanInstruction: {
    color: '#FFF', marginTop: spacing.xl, fontSize: 16, fontWeight: '600'
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center'
  },
  rescanBtn: {
    backgroundColor: '#3E2723',
    paddingHorizontal: spacing.xl, paddingVertical: 14,
    borderRadius: radius.full
  },
  rescanText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resultCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  resultTitle: { ...typography.h2, color: '#4CAF50', textAlign: 'center', marginBottom: spacing.lg },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  resultLabel: { color: '#666', fontSize: 14 },
  resultValue: { color: '#333', fontSize: 15, fontWeight: 'bold', maxWidth: '70%', textAlign: 'right' }
});
