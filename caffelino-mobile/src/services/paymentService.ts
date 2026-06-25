import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Meetup, OrderItem } from '../types';

export interface PaymentSuccessResponse {
  paymentId: string;
  paymentStatus: 'SUCCESS';
  paymentTimestamp: string;
}

export interface OwnerOrder {
  orderId: string;
  meetupCode: string;
  hostName: string;
  cafeName: string;
  meetupDate: string;
  meetupTime: string;
  memberCount: number;
  items: OrderItem[];
  couponApplied?: string | null;
  splitEnabled: boolean;
  totalAmount: number;
  paymentStatus: 'Confirmed';
  tableStatus: 'Reserved';
  status: 'New' | 'Accepted' | 'Preparing' | 'Ready' | 'Served';
  createdAt: string;
}

const OWNER_ORDERS_KEY = '@caffelino/owner_orders';

export const paymentService = {
  /**
   * Phase 1: Simulate Razorpay checkout
   * Phase 2: Will be replaced by real native Razorpay SDK
   */
  processRazorpayPayment: async (amount: number, purpose: string): Promise<PaymentSuccessResponse> => {
    // In Phase 2, this will invoke RazorpayCheckout.open(options)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          paymentId: `pay_${Math.random().toString(36).substring(2, 11)}`,
          paymentStatus: 'SUCCESS',
          paymentTimestamp: new Date().toISOString(),
        });
      }, 2000);
    });
  },

  /**
   * Save the completed order to the Cafe Owner Dashboard (simulated DB)
   */
  sendOrderToCafeDashboard: async (
    meetup: Meetup,
    items: OrderItem[],
    totalAmount: number,
    hostName: string,
    cafeName: string,
    splitEnabled: boolean,
    couponApplied?: string | null
  ) => {
    try {
      const existing = await AsyncStorage.getItem(OWNER_ORDERS_KEY);
      const orders: OwnerOrder[] = existing ? JSON.parse(existing) : [];

      const memberCount = meetup.memberCount ?? meetup.members?.length ?? 1;

      const newOrder: OwnerOrder = {
        orderId: Math.floor(100000 + Math.random() * 900000).toString(),
        meetupCode: meetup.meetupCode,
        hostName,
        cafeName,
        meetupDate: meetup.date,
        meetupTime: meetup.time,
        memberCount,
        items,
        couponApplied,
        splitEnabled,
        totalAmount,
        paymentStatus: 'Confirmed',
        tableStatus: 'Reserved',
        status: 'New',
        createdAt: new Date().toISOString(),
      };

      orders.unshift(newOrder);
      await AsyncStorage.setItem(OWNER_ORDERS_KEY, JSON.stringify(orders));
      return newOrder;
    } catch (err) {
      console.error('Failed to send order to dashboard', err);
      throw err;
    }
  },

  getOwnerOrders: async (): Promise<OwnerOrder[]> => {
    try {
      const existing = await AsyncStorage.getItem(OWNER_ORDERS_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (err) {
      return [];
    }
  },

  updateOwnerOrderStatus: async (orderId: string, status: OwnerOrder['status']): Promise<void> => {
    try {
      const existing = await AsyncStorage.getItem(OWNER_ORDERS_KEY);
      if (!existing) return;
      const orders: OwnerOrder[] = JSON.parse(existing);
      const updated = orders.map((o) => (o.orderId === orderId ? { ...o, status } : o));
      await AsyncStorage.setItem(OWNER_ORDERS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update owner order status', err);
    }
  },
};
