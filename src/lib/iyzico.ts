import Iyzipay from 'iyzipay';

// iyzico configuration
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.NODE_ENV === 'production' 
    ? 'https://api.iyzipay.com' 
    : 'https://sandbox-api.iyzipay.com'
});

export default iyzipay;

// Helper types for iyzico
export interface IyzicoPaymentRequest {
  locale?: 'tr' | 'en';
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: 'USD' | 'EUR' | 'TRY';
  installment: string;
  basketId: string;
  paymentChannel: 'WEB' | 'MOBILE' | 'MOBILE_WEB';
  paymentGroup: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION';
  callbackUrl: string;
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
  paymentCard?: IyzicoPaymentCard;
}

export interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  gsmNumber?: string;
  email: string;
  identityNumber: string; // TC Kimlik veya Pasaport numarası
  lastLoginDate?: string;
  registrationDate?: string;
  registrationAddress: string;
  ip: string;
  city: string;
  country: string;
  zipCode?: string;
}

export interface IyzicoAddress {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: 'PHYSICAL' | 'VIRTUAL';
  price: string;
}

export interface IyzicoPaymentCard {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  registerCard?: '0' | '1';
}

export interface IyzicoCheckoutFormRequest {
  locale?: 'tr' | 'en';
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: 'USD' | 'EUR' | 'TRY';
  basketId: string;
  paymentGroup: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION';
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
}

// Generate unique conversation ID
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate basket ID
export function generateBasketId(userId: string, type: string): string {
  return `basket_${userId}_${type}_${Date.now()}`;
}
