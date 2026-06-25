export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  avatarId?: string;
  gender?: string;
  role: string;
  profileCompleted: boolean;
  username?: string;
  city?: string;
  isVerified?: boolean;
  firebaseUid?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  otp?: string;
}

export interface Cafe {
  _id: string;
  Name: string;
  Cafe_Address?: string;
  latitude?: number;
  longitude?: number;
  Average_Cost?: number;
  AboutCafe?: string;
  Cafe_photos?: string[];
  cloudinaryImages?: string[];
  profilePicture?: string;
  establishmentType?: string;
  menuItems?: MenuItem[];
  rating?: number;
  costForOne?: number;
  verified?: boolean;
  phone?: string;
  Phonenumber?: string;
  managerName?: string;
  coordinates?: { lat: number; lng: number };
  openNow?: boolean;
}

export interface MenuItem {
  _id: string;
  item_name: string;
  price: number;
  Category?: string;
  image_url?: string;
  description_food?: string;
  available?: boolean;
}

export interface Feedback {
  _id: string;
  userId: string;
  username: string;
  profileImage?: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export interface MeetupMember {
  userId: string;
  name: string;
  joinedAt?: string;
  avatarId?: string;
}

export interface Event {
  _id: string;
  eventName: string;
  description: string;
  category: string;
  bannerUrl: string;
  date: string;
  startTime: string;
  endTime: string;
  cafeName: string;
  venueName: string;
  fullAddress: string;
  city: string;
  state: string;
  country: string;
  googleMapsLink?: string;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  ticketsSold: number;
  organizationName?: string;
  eventInstagramId?: string;
  companyName?: string;
  companyInstagram?: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  instagramId?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt?: string;
}

export interface EventRegistration {
  _id: string;
  eventId: Event | string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  ticketNumber: string;
  qrCodeUrl: string;
  paymentId?: string;
  orderId?: string;
  amountPaid: number;
  createdAt: string;
}

export interface MeetupCafe {
  cafeId: string;
  name?: string;
  cafeName?: string;
  cafeImage?: string;
  location?: string;
  cafe_location?: string;
}

export interface OrderBillItem {
  name: string;
  quantity: number;
  price: number;
}

export interface MeetupBillData {
  cardType?:
    | 'meetup_bill'
    | 'meetup_confirmed'
    | 'order_locked'
    | 'order_placed'
    | 'table_confirmed';
  orderId?: string;
  displayOrderId?: string;
  cafeName?: string;
  orderedBy?: string;
  billCreatorId?: string;
  items?: OrderBillItem[];
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  gstTotal?: number;
  coupon?: string;
  couponDiscount?: number;
  totalPayable?: number;
  finalAmount?: number;
  splitEnabled?: boolean;
  perPersonAmount?: number;
  hostPaysAmount?: number;
  memberCount?: number;
  locked?: boolean;
  billStatus?: 'awaiting_table_confirmation' | 'awaiting_confirmation' | 'locked';
  tableNumber?: string;
  reservationFee?: number;
}

export interface MeetupMessage {
  _id: string;
  meetupId: string;
  userId: string;
  userName: string;
  avatarId?: string;
  message: string;
  type: 'user' | 'system' | 'bill' | 'payment';
  createdAt: string;
  replyTo?: { userName: string; message: string };
  reactions?: Record<string, string[]>;
  imageUrl?: string;
  billData?: MeetupBillData;
}

export interface CafeMenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  foodType?: string;
  description?: string;
  isVeg?: boolean;
  available?: boolean;
}

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  isVeg?: boolean;
  description?: string;
}

export interface Meetup {
  _id: string;
  meetupCode: string;
  title: string;
  organizerId: string;
  organizerName: string;
  date?: string;
  time?: string;
  members: MeetupMember[];
  status: string;
  selectedCafe?: MeetupCafe | null;
  cafesForVoting?: MeetupCafe[];
  createdAt?: string;
  memberCount?: number;
  reservationFeePaid?: boolean;
  reservationFeeAmount?: number;
  tableNumber?: string;
  billLocked?: boolean;
}

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  MobileNumber: undefined;
  Otp: { mobileNumber: string; localDigits: string; countryCode: string; isNewUser: boolean };
  OnboardingName: { mobileNumber?: string; countryCode?: string } | undefined;
  OnboardingGender: { mobileNumber: string; countryCode: string; fullName: string };
  OnboardingAvatar: {
    mobileNumber: string;
    countryCode: string;
    fullName: string;
    gender: 'male' | 'female';
  };
  OnboardingReady: {
    mobileNumber: string;
    countryCode: string;
    fullName: string;
    gender: 'male' | 'female';
    avatarId: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Events: undefined;
  Loved: undefined;
};

export type MainStackParamList = {
  Tabs: { screen?: keyof MainTabParamList } | undefined;
  CafeDetails: { cafeId: string; initialCafe?: Cafe };
  EventDetails: { eventId: string };
  EventSuccess: { ticketNumber?: string };
  AttendanceScanner: undefined;
  Profile: undefined;
  Settings: undefined;
  MeetupDetails: { meetupId: string };
  MeetupChat: { meetupId: string; meetupCode?: string };
  MyMeetups: undefined;
  MeetupOrder: {
    meetupId: string;
    meetupCode?: string;
    cafeId: string;
    cafeName: string;
    isHost: boolean;
    reservationFeePaid: boolean;
    billLocked: boolean;
    memberCount: number;
    meetupDate?: string;
    meetupTime?: string;
    editOrderId?: string;
  };
  MyTickets: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
  Notifications: undefined;
};
