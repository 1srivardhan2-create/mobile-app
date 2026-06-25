import { apiRequest } from './client';
import type { CafeMenuItem, CartLine, Meetup, MeetupMessage } from '../types';

export const meetupsApi = {
  getAll() {
    return apiRequest<Meetup[]>('/api/meetups/all');
  },

  getMy(userId: string) {
    return apiRequest<{ success: boolean; meetups: Meetup[] }>(
      `/api/meetups/my?userId=${encodeURIComponent(userId)}`,
    );
  },

  getHosted(userId: string) {
    return apiRequest<{ success: boolean; meetups: Meetup[]; count: number }>(
      `/api/meetups/hosted/${encodeURIComponent(userId)}`,
    );
  },

  endMeetup(payload: { meetupId: string; userId: string }) {
    return apiRequest<{ success: boolean; meetup: Meetup }>('/api/meetups/end', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getByUser(userId: string) {
    return apiRequest<Meetup[]>(`/api/meetups/user/${userId}`);
  },

  getById(id: string) {
    return apiRequest<{ success: boolean; meetup: Meetup }>(`/api/meetups/${id}`);
  },

  getByCode(code: string) {
    return apiRequest<{ success: boolean; meetup: Meetup }>(
      `/api/meetups/code/${code.toUpperCase()}`,
    );
  },

  create(payload: {
    title: string;
    organizerId: string;
    organizerName: string;
    organizerAvatarId?: string;
    date?: string;
    time?: string;
  }) {
    return apiRequest<{ success: boolean; meetup: Meetup }>('/api/meetups/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  join(payload: { meetupCode: string; userId: string; name: string; avatarId?: string }) {
    return apiRequest<{ success: boolean; meetup: Meetup }>('/api/meetups/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  leave(payload: { meetupId: string; userId: string }) {
    return apiRequest<{ success: boolean; deleted?: boolean; meetup?: Meetup }>(
      '/api/meetups/leave',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  selectCafe(payload: {
    meetupId: string;
    userId: string;
    cafe: {
      cafeId: string;
      cafeName: string;
      cafeImage?: string;
      location?: string;
    };
  }) {
    return apiRequest<{ success: boolean; meetup: Meetup }>('/api/meetups/select-cafe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMessages(meetupId: string) {
    return apiRequest<{ success: boolean; messages: MeetupMessage[] }>(
      `/api/meetups/messages/${meetupId}`,
    );
  },

  sendMessage(payload: {
    meetupId: string;
    userId: string;
    userName: string;
    message: string;
    type?: 'user' | 'system' | 'bill' | 'payment';
    billData?: MeetupMessage['billData'];
  }) {
    return apiRequest<{ success: boolean; message: MeetupMessage }>('/api/meetups/message', {
      method: 'POST',
      body: JSON.stringify({ ...payload, type: payload.type ?? 'user' }),
    });
  },

  getCafeMenu(meetupId: string) {
    return apiRequest<{
      success: boolean;
      menuItems: CafeMenuItem[];
      menuByCategory: Record<string, CafeMenuItem[]>;
      cafeId: string;
      cafeName: string;
    }>(`/api/meetups/${meetupId}/cafe-menu`);
  },

  getAvailableCoupons(cafeName: string) {
    return apiRequest<{
      success: boolean;
      coupons: Array<{
        code: string;
        description: string;
        discountValue: number;
        discountType: 'flat' | 'percent';
        effectiveMinOrder: number;
      }>;
    }>(`/api/coupons/available/${encodeURIComponent(cafeName)}`);
  },

  confirmTableReservation(payload: {
    meetupId: string;
    userId: string;
    userName: string;
    demo?: boolean;
  }) {
    return apiRequest<{
      success: boolean;
      tableNumber: string;
      reservationFeeAmount: number;
      alreadyPaid?: boolean;
    }>('/api/meetups/confirm-reservation', {
      method: 'POST',
      body: JSON.stringify({ ...payload, demo: true }),
    });
  },

  placeOrder(payload: {
    meetupId: string;
    userId: string;
    userName: string;
    items: CartLine[];
    subtotal: number;
    cgst: number;
    sgst: number;
    total: number;
    finalAmount: number;
    status: string;
    cafeId: string;
    couponCode?: string;
    couponDiscount?: number;
    splitType?: string;
    splitEnabled?: boolean;
    perPersonAmount?: number;
    memberCount?: number;
    meetupDate?: string;
    meetupTime?: string;
    postBillToChat?: boolean;
    orderId?: string;
  }) {
    return apiRequest<{ success: boolean; order: { orderId: string; status: string } }>(
      '/api/meetups/order',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },

  getOrders(meetupId: string) {
    return apiRequest<{
      success: boolean;
      orders: Array<{
        orderId: string;
        items: CartLine[];
        subtotal: number;
        cgst: number;
        sgst: number;
        total: number;
        status: string;
      }>;
    }>(`/api/meetups/orders/${meetupId}`);
  },

  createRazorpayOrder(payload: { meetupId: string; userId: string }) {
    return apiRequest<{
      success: boolean;
      orderId: string;
      amount: number;
      currency: string;
    }>('/api/meetups/razorpay-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    meetupId: string;
    userId: string;
    orderPayload: any;
  }) {
    return apiRequest<{
      success: boolean;
      order: { orderId: string; status: string };
    }>('/api/meetups/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
