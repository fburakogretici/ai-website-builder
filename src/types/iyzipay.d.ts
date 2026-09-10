declare module 'iyzipay' {
  interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface Buyer {
    id: string;
    name: string;
    surname: string;
    gsmNumber?: string;
    email: string;
    identityNumber: string;
    lastLoginDate?: string;
    registrationDate?: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode?: string;
  }

  interface Address {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  }

  interface BasketItem {
    id: string;
    name: string;
    category1: string;
    category2?: string;
    itemType: 'PHYSICAL' | 'VIRTUAL';
    price: string;
  }

  interface CheckoutFormInitializeRequest {
    locale?: string;
    conversationId: string;
    price: string;
    paidPrice: string;
    currency: 'USD' | 'EUR' | 'TRY' | 'GBP' | 'IRR' | 'NOK' | 'RUB' | 'CHF';
    basketId: string;
    paymentGroup: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION';
    callbackUrl: string;
    enabledInstallments?: number[];
    buyer: Buyer;
    shippingAddress: Address;
    billingAddress: Address;
    basketItems: BasketItem[];
  }

  interface CheckoutFormRetrieveRequest {
    locale?: string;
    conversationId?: string;
    token: string;
  }

  interface CheckoutFormInitializeResult {
    status: string;
    locale?: string;
    systemTime?: number;
    conversationId?: string;
    token?: string;
    checkoutFormContent?: string;
    tokenExpireTime?: number;
    paymentPageUrl?: string;
    errorCode?: string;
    errorMessage?: string;
    errorGroup?: string;
  }

  interface CheckoutFormRetrieveResult {
    status: string;
    locale?: string;
    systemTime?: number;
    conversationId?: string;
    price?: number;
    paidPrice?: number;
    installment?: number;
    paymentId?: string;
    fraudStatus?: number;
    merchantCommissionRate?: number;
    merchantCommissionRateAmount?: number;
    iyziCommissionRateAmount?: number;
    iyziCommissionFee?: number;
    cardType?: string;
    cardAssociation?: string;
    cardFamily?: string;
    binNumber?: string;
    lastFourDigits?: string;
    basketId?: string;
    currency?: string;
    itemTransactions?: any[];
    authCode?: string;
    phase?: string;
    hostReference?: string;
    paymentStatus?: string;
    errorCode?: string;
    errorMessage?: string;
    errorGroup?: string;
  }

  class CheckoutFormInitialize {
    create(
      request: CheckoutFormInitializeRequest,
      callback: (err: Error | null, result: CheckoutFormInitializeResult) => void
    ): void;
  }

  class CheckoutForm {
    retrieve(
      request: CheckoutFormRetrieveRequest,
      callback: (err: Error | null, result: CheckoutFormRetrieveResult) => void
    ): void;
  }

  class Iyzipay {
    constructor(config: IyzipayConfig);
    checkoutFormInitialize: CheckoutFormInitialize;
    checkoutForm: CheckoutForm;
  }

  export = Iyzipay;
}
