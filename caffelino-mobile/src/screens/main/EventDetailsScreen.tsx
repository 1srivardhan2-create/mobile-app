import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, Linking, Dimensions, Modal, TextInput, Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows, spacing, typography } from '../../theme';
import { API_BASE_URL } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import RazorpayCheckout from 'react-native-razorpay';
import { getToken } from '../../services/storage.service';

const { width } = Dimensions.get('window');

export function EventDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { eventId } = route.params;
  const { user } = useAuth();
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileInput, setMobileInput] = useState('');

  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load persisted terms acceptance
  useEffect(() => {
    AsyncStorage.getItem('caffelino_terms_accepted').then((val) => {
      if (val === 'true') setTermsAccepted(true);
    });
  }, []);

  const handleAcceptTerms = async (val: boolean) => {
    setTermsAccepted(val);
    if (val) await AsyncStorage.setItem('caffelino_terms_accepted', 'true');
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEventDetails();
      if (user?.id) {
        checkIfSaved();
      }
    }, [eventId, user?.id])
  );

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
      if (res.data.success) {
        setEvent(res.data.event);
        setRegisteredCount(res.data.registeredCount || 0);
        
        // Fetch related events
        const allRes = await axios.get(`${API_BASE_URL}/api/events`);
        if (allRes.data.success) {
          const related = allRes.data.events.filter((e: any) => e.category === res.data.event.category && e._id !== eventId).slice(0, 3);
          setRelatedEvents(related);
        }
      }

      // Check if registered
      if (user?.id) {
        const ticketRes = await axios.get(`${API_BASE_URL}/api/events/my-tickets/${user.id}`);
        if (ticketRes.data.success) {
          const hasTicket = ticketRes.data.tickets.some((t: any) => t.eventId?._id === eventId || t.eventId === eventId);
          setIsRegistered(hasTicket);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/favorites/ids?itemType=event`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.ids.includes(eventId)) {
        setIsSaved(true);
      }
    } catch (err) {
      console.log('Error checking saved status:', err);
    }
  };

  const toggleSave = async () => {
    if (!user) return alert('Please login to save events');
    try {
      // Optimistic update
      setIsSaved(!isSaved);
      const token = await getToken();
      await axios.post(`${API_BASE_URL}/api/favorites/toggle`, 
        { eventId, itemType: 'event' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
    } catch (err) {
      setIsSaved(!isSaved); // revert on error
      console.error('Failed to toggle save:', err);
    }
  };

  const handleRegisterFree = async () => {
    setShowConfirmModal(false);
    setRegistering(true);
    try {
      console.log("Calling registration API...");
      const res = await axios.post(`${API_BASE_URL}/api/events/${eventId}/register-free`, {
        userId: user?.id,
        userName: user?.name || user?.username,
        email: user?.email,
        mobileNumber: user?.mobileNumber || mobileInput,
      });
      console.log("Registration Response:", res.data);
      if (res.data.success) {
        navigation.navigate('EventSuccess', { ticketNumber: res.data.ticketNumber });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Server error during registration';
      console.error("Registration Error Details:", msg);
      if (msg === 'Registration already exists') {
        setAlreadyRegistered(true);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterClick = () => {
    if (!user) return setErrorMsg('Please login to register for events');
    if (!user.isVerified) return setErrorMsg('Please verify your phone number to register for events.');
    if (!user.mobileNumber && !mobileInput) return setShowMobileModal(true);
    setShowConfirmModal(true);
  };

  const initiatePayment = async () => {
    if (!user) return alert('Please login to purchase tickets');
    if (!user.isVerified) return alert('Please verify your phone number to purchase tickets.');
    if (!user.mobileNumber && !mobileInput) return setShowMobileModal(true);
    
    setRegistering(true);
    try {
      const targetUrl = `${API_BASE_URL}/api/payments/create-order`;
      console.log('Initiating payment for event:', eventId, 'at URL:', targetUrl, 'with payload:', { eventId, userId: user.id, quantity: 1 });
      const res = await axios.post(targetUrl, {
        eventId,
        userId: user.id,
        quantity: 1
      });

      console.log('--- API RESPONSE SUCCESS ---', res.data);

      if (!res.data.success) {
        throw new Error(`Failed to create order: ${res.data.message || 'Unknown'}`);
      }

      const { orderId, amount, currency, key } = res.data;

      const options = {
        description: `Ticket for ${event?.eventName}`,
        image: event?.bannerUrl || 'https://your-logo-url.png',
        currency: currency,
        key: key,
        amount: amount,
        name: 'Caffelino',
        order_id: orderId,
        theme: { color: palette.coffeeBrown },
        prefill: {
          email: user.email || '',
          contact: user.mobileNumber || mobileInput || '',
          name: user.name || user.username || ''
        }
      };

      console.log('--- OPEN RAZORPAY ---', options);
      
      RazorpayCheckout.open(options).then(async (data: any) => {
        // Success handler
        console.log('--- PAYMENT SUCCESS ---', data);
        try {
          console.log('--- VERIFY PAYMENT API CALL ---');
          const verifyRes = await axios.post(`${API_BASE_URL}/api/payments/verify`, {
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            eventId,
            userId: user.id,
            quantity: 1
          });

          if (verifyRes.data.success) {
            console.log('--- PAYMENT VERIFIED SUCCESSFULLY ---');
            alert('Ticket Purchased Successfully!');
            navigation.navigate('MyTickets');
          } else {
            console.error('--- PAYMENT VERIFICATION FAILED ---', verifyRes.data);
            alert('Payment verification failed');
          }
        } catch (error) {
          console.error('--- VERIFY PAYMENT CATCH BLOCK ERROR ---', error);
          alert('Payment verified but there was an error updating your ticket. Please contact support.');
        } finally {
          console.log('--- CLEARING LOADING STATE ---');
          setRegistering(false);
        }
      }).catch((error: any) => {
        // Failure handler
        console.error('--- PAYMENT FAILURE ---', error);
        alert(`Error: ${error.description || 'Payment cancelled'}`);
        console.log('--- CLEARING LOADING STATE (FAILED) ---');
        setRegistering(false);
      });

    } catch (error: any) {
      console.error('==== INITIATE PAYMENT ERROR ====');
      console.error('Error Message:', error.message);
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('================================');
      alert('Could not initiate payment. Check Expo terminal for details.');
      setRegistering(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={[styles.center, { backgroundColor: palette.cream, flex: 1 }]}>
        <ActivityIndicator size="large" color={palette.goldAccent} />
      </View>
    );
  }

  const isFree = event.ticketPrice === 0;
  const isSoldOut = event.availableSeats <= 0;
  const isClosed = event.status === 'completed' && !isSoldOut;
  const disableRegister = isSoldOut || isClosed;

  const handleShare = async () => {
    try {
      const priceText = event.ticketPrice === 0 ? 'FREE Entry!' : `Tickets: ₹${event.ticketPrice}`;
      await Share.share({
        message: `🔥 *${event.eventName}*\n\n📅 Date: ${event.date} at ${event.startTime}\n📍 Venue: ${event.venueName}, ${event.city}\n💰 ${priceText}\n\nCheck it out and join me! 👇\n${event.bannerUrl || 'https://caffelino.com'}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToCalendar = () => {
    // Simple deep link fallback for calendar
    const url = Platform.select({
      ios: 'calshow://',
      android: 'content://com.android.calendar/time/',
    });
    if (url) {
      Linking.openURL(url).catch(() => alert('Could not open Calendar'));
    }
  };
  const handleOpenMaps = () => {
    const mapQuery = encodeURIComponent(`${event.venueName || ''} ${event.fullAddress || event.address || ''} ${event.city || ''} ${event.state || ''} ${event.country || ''} ${event.pincode || ''}`);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
    Linking.openURL(googleMapsUrl).catch(() => alert('Could not open Maps'));
  };

  const handleOpenInstagram = async () => {
    const instaId = event.eventInstagramId || event.companyInstagram;
    if (!instaId) return;
    const username = instaId.replace('@', '');
    const appUrl = `instagram://user?username=${username}`;
    const webUrl = `https://instagram.com/${username}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Linking.openURL(webUrl);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: palette.cream }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.bannerUrl }} style={styles.heroImage} />
          <LinearGradient 
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)']} 
            style={styles.heroGradient} 
          />
          
          {/* Header Controls */}
          <View style={[styles.headerControls, { top: insets.top + spacing.sm }]}>
            <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable style={styles.iconButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#FFF" />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={toggleSave}>
                <Ionicons name={isSaved ? "heart" : "heart-outline"} size={24} color={isSaved ? "#E1306C" : "#FFF"} />
              </Pressable>
            </View>
          </View>

          {/* Hero Content */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.heroContent}>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: palette.goldAccent }]}>
                <Text style={styles.badgeText}>{event.category?.toUpperCase() || 'EVENT'}</Text>
              </View>
              {isSoldOut && !isClosed && (
                <View style={[styles.badge, { backgroundColor: '#E53935', marginLeft: spacing.sm }]}>
                  <Text style={styles.badgeText}>SOLD OUT</Text>
                </View>
              )}
              {isClosed && (
                <View style={[styles.badge, { backgroundColor: '#757575', marginLeft: spacing.sm }]}>
                  <Text style={styles.badgeText}>CLOSED</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.heroTitle}>{event.eventName}</Text>
            
            <View style={styles.heroMetaContainer}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="calendar-outline" size={16} color={palette.goldAccent} />
                <Text style={styles.heroMetaText}>{new Date(event.date || event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="time-outline" size={16} color={palette.goldAccent} />
                <Text style={styles.heroMetaText}>{event.startTime} - {event.endTime}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.bodyContainer}>
          
          {/* ABOUT SECTION */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.card, shadows.card, { backgroundColor: '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: palette.espresso }]}>About this Event</Text>
            <Text style={[styles.description, { color: palette.textSecondary }]}>{event.description || event.eventDescription || "No description provided for this event."}</Text>
          </Animated.View>

          {/* TICKET INFO STATS */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.statsRow}>
            <View style={[styles.statCard, shadows.card, { backgroundColor: '#FFF', flex: 1 }]}>
              <Ionicons name="ticket-outline" size={24} color={palette.goldAccent} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: palette.espresso }]}>{isFree ? 'Free' : `₹${event.ticketPrice}`}</Text>
              <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Ticket Price</Text>
            </View>
          </Animated.View>

          {/* LOCATION SECTION */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={[styles.card, shadows.card, { backgroundColor: '#FFF' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: palette.espresso, marginBottom: 0 }]}>Location</Text>
              <Pressable onPress={handleAddToCalendar} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar" size={16} color={palette.goldAccent} />
                <Text style={{ color: palette.goldAccent, fontWeight: 'bold' }}>Add to Calendar</Text>
              </Pressable>
            </View>
            <View style={styles.locationRow}>
              <View style={[styles.locationIconBg, { backgroundColor: palette.cream }]}>
                <Ionicons name="location" size={24} color={palette.coffeeBrown} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.venueName, { color: palette.espresso }]}>{event.venueName}</Text>
                {event.cafeName && <Text style={[styles.cafeName, { color: palette.goldAccent }]}>at {event.cafeName}</Text>}
                <Text style={[styles.addressText, { color: palette.textSecondary }]}>{event.fullAddress || event.address}</Text>
                <Text style={[styles.addressText, { color: palette.textSecondary }]}>{event.city}, {event.state} {event.country}</Text>
              </View>
            </View>
            
            <Pressable 
              style={[styles.mapButton, { borderColor: palette.goldAccent }]} 
              onPress={handleOpenMaps}
            >
              <Ionicons name="map-outline" size={18} color={palette.goldAccent} />
              <Text style={[styles.mapButtonText, { color: palette.goldAccent }]}>Open in Google Maps</Text>
            </Pressable>
          </Animated.View>

          {/* ORGANIZER SECTION */}
          <Animated.View entering={FadeInUp.delay(500).springify()} style={[styles.card, shadows.card, { backgroundColor: '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: palette.espresso }]}>Hosted By</Text>
            <View style={styles.organizerRow}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: palette.coffeeBrown }]}>
                <Text style={styles.avatarText}>{(event.organizationName || event.companyName || 'Caffelino Events').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.organizerName, { color: palette.espresso }]}>{event.organizationName || event.companyName || 'Caffelino Events'}</Text>
                
                {(event.eventInstagramId || event.companyInstagram) && (
                  <Pressable 
                    style={styles.instaBtn}
                    onPress={handleOpenInstagram}
                  >
                    <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                    <Text style={[styles.instaText, { color: '#E1306C' }]}>{event.eventInstagramId || event.companyInstagram}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>

          {/* RELATED EVENTS SECTION */}
          {relatedEvents.length > 0 && (
            <Animated.View entering={FadeInUp.delay(600).springify()} style={{ marginTop: spacing.md }}>
              <Text style={[styles.sectionTitle, { color: palette.espresso, marginLeft: spacing.lg }]}>Related Events</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg }}>
                {relatedEvents.map((relEvent, idx) => (
                  <Pressable 
                    key={relEvent._id} 
                    style={[styles.card, shadows.card, { backgroundColor: '#FFF', width: 220, padding: 0, overflow: 'hidden' }]}
                    onPress={() => {
                      navigation.push('EventDetails', { eventId: relEvent._id });
                    }}
                  >
                    <Image source={{ uri: relEvent.bannerUrl }} style={{ width: '100%', height: 120, resizeMode: 'cover' }} />
                    <View style={{ padding: spacing.md }}>
                      <Text style={[styles.eventName, { color: palette.espresso, fontSize: 16 }]} numberOfLines={1}>{relEvent.eventName}</Text>
                      <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 4 }}>{relEvent.date}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

        </View>
      </ScrollView>

      {/* FIXED BOTTOM BAR */}
      <Animated.View entering={FadeInDown.delay(700).springify()} style={[styles.bottomBar, shadows.card, { paddingBottom: insets.bottom || spacing.md }]}>

        <View style={styles.bottomBarPriceContainer}>
          <Text style={[styles.bottomBarPrice, { color: palette.espresso }]}>
            {isRegistered ? '✅ Registered' : (isFree ? 'FREE' : `₹${event.ticketPrice}`)}
          </Text>
          <Text style={[styles.bottomBarSubtext, { color: disableRegister ? '#E53935' : palette.textSecondary }]}>
            {isRegistered ? 'You have a ticket!' : isClosed ? 'Event Closed' : isSoldOut ? 'Sold Out' : 'Grab your tickets now!'}
          </Text>
        </View>

        {isRegistered ? (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: palette.coffeeBrown }]}
            onPress={() => navigation.navigate('MyTickets')}
          >
            <Text style={styles.actionBtnText}>View Ticket</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.actionBtn, 
              { backgroundColor: (disableRegister || (!isFree && !termsAccepted)) ? '#BDBDBD' : palette.coffeeBrown }
            ]}
            disabled={disableRegister || registering || (!isFree && !termsAccepted)}
            onPress={isFree ? handleRegisterClick : initiatePayment}
          >
            {registering ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.actionBtnText}>
                {isClosed ? 'CLOSED' : isSoldOut ? 'SOLD OUT' : isFree ? 'REGISTER NOW' : 'BUY TICKET'}
              </Text>
            )}
          </Pressable>
        )}
      </Animated.View>



      {/* CONFIRMATION MODAL */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(300)} style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Registration</Text>
            <Text style={styles.modalDesc}>You are registering for:</Text>
            <Text style={styles.modalEventName}>{event.eventName}</Text>
            
            <View style={styles.modalMetaRow}>
              <Ionicons name="calendar-outline" size={16} color={palette.goldAccent} />
              <Text style={styles.modalMetaText}>{new Date(event.eventDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Ionicons name="time-outline" size={16} color={palette.goldAccent} />
              <Text style={styles.modalMetaText}>{event.startTime}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Ionicons name="location-outline" size={16} color={palette.goldAccent} />
              <Text style={styles.modalMetaText}>{event.venueName}</Text>
            </View>

            <Text style={styles.modalQuestion}>Do you want to continue?</Text>
            
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleRegisterFree}>
                <Text style={styles.modalConfirmText}>Register</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ALREADY REGISTERED MODAL */}
      <Modal visible={alreadyRegistered} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(300)} style={styles.modalContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>✅ You are already registered</Text>
            <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: 20 }]}>
              You have already secured a spot for this event.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setAlreadyRegistered(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: palette.coffeeBrown }]} 
                onPress={() => {
                  setAlreadyRegistered(false);
                  navigation.navigate('MyTickets');
                }}
              >
                <Text style={styles.modalConfirmText}>View Ticket</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ERROR MODAL */}
      <Modal visible={!!errorMsg} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(300)} style={styles.modalContainer}>
            <Ionicons name="alert-circle" size={48} color="#E53935" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Registration Error</Text>
            <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: 20, color: '#E53935', fontWeight: 'bold' }]}>
              {errorMsg}
            </Text>
            <Pressable 
              style={[styles.modalConfirmBtn, { width: '100%', backgroundColor: '#E53935' }]} 
              onPress={() => setErrorMsg('')}
            >
              <Text style={styles.modalConfirmText}>Dismiss</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* MOBILE NUMBER MODAL */}
      <Modal visible={showMobileModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(300)} style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Mobile Number Required</Text>
            <Text style={[styles.modalDesc, { textAlign: 'center', marginBottom: 20 }]}>
              Please provide your mobile number to complete registration.
            </Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 20, width: '100%',
                fontSize: 16
              }}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              value={mobileInput}
              onChangeText={setMobileInput}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowMobileModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalConfirmBtn, { backgroundColor: palette.coffeeBrown }]} 
                onPress={() => {
                  if (mobileInput.length < 10) return alert('Enter a valid mobile number');
                  setShowMobileModal(false);
                  if (isFree) setShowConfirmModal(true);
                  else setShowPayment(true);
                }}
              >
                <Text style={styles.modalConfirmText}>Continue</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  heroContainer: { width: '100%', height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { position: 'absolute', width: '100%', height: '100%', left: 0, top: 0 },
  
  headerControls: { 
    position: 'absolute', left: 0, right: 0, 
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingHorizontal: spacing.lg, zIndex: 10 
  },
  iconButton: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center'
  },
  
  heroContent: { 
    position: 'absolute', bottom: spacing.xl, left: spacing.lg, right: spacing.lg 
  },
  badgeContainer: { flexDirection: 'row', marginBottom: spacing.sm },
  badge: { 
    paddingHorizontal: spacing.md, paddingVertical: 4, 
    borderRadius: radius.full 
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { 
    ...typography.h1, color: '#FFF', 
    fontSize: 28, lineHeight: 34, marginBottom: spacing.md 
  },
  heroMetaContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  bodyContainer: { padding: spacing.lg, gap: spacing.lg, marginTop: -spacing.md },
  
  card: { 
    borderRadius: radius.lg, padding: spacing.lg, 
  },
  sectionTitle: { ...typography.h2, fontSize: 18, marginBottom: spacing.md },
  description: { ...typography.body, lineHeight: 24, fontSize: 15 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { 
    borderRadius: radius.lg, padding: spacing.lg, 
    justifyContent: 'center', alignItems: 'center' 
  },
  statIcon: { marginBottom: spacing.xs },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '500' },
  
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  locationIconBg: { 
    width: 48, height: 48, borderRadius: 24, 
    justifyContent: 'center', alignItems: 'center' 
  },
  venueName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cafeName: { fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  addressText: { fontSize: 14, lineHeight: 20 },
  mapButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    borderWidth: 1, borderRadius: radius.md, 
    paddingVertical: 10, marginTop: spacing.md, gap: 8 
  },
  mapButtonText: { fontSize: 14, fontWeight: '700' },
  
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarPlaceholder: { 
    width: 56, height: 56, borderRadius: 28, 
    justifyContent: 'center', alignItems: 'center' 
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  organizerName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  organizerContact: { fontSize: 14, marginBottom: 2 },
  instaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  instaText: { fontSize: 14, fontWeight: '600' },
  
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderTopColor: '#F0F0F0'
  },
  termsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  termsText: { fontSize: 13, flex: 1, lineHeight: 18 },
  bottomBarPriceContainer: { flex: 1 },
  bottomBarPrice: { ...typography.h2, fontSize: 24 },
  bottomBarSubtext: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  actionBtn: { 
    paddingHorizontal: spacing.xl, paddingVertical: 16, 
    borderRadius: radius.full, minWidth: 160, alignItems: 'center' 
  },
  actionBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  // MODALS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContainer: { width: '100%', backgroundColor: '#FFF', borderRadius: radius.xl, padding: spacing.xl },
  modalTitle: { ...typography.h2, fontSize: 20, marginBottom: spacing.md },
  modalDesc: { ...typography.body, fontSize: 15, color: '#666' },
  modalEventName: { ...typography.h2, fontSize: 18, color: '#3E2723', marginVertical: spacing.xs },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  modalMetaText: { fontSize: 14, fontWeight: '600', color: '#555' },
  modalQuestion: { marginTop: spacing.lg, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.full, alignItems: 'center', backgroundColor: '#F5F5F5' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#555' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.full, alignItems: 'center', backgroundColor: '#3E2723' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
