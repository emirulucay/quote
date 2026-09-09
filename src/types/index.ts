import { Language, Currency } from "../lib/i18n";

export type ServicesLayout = "inline" | "tabs";
export type BillingType = "one-time" | "subscription";
export type BillingCycle = "monthly" | "yearly" | "quarterly";
export type PdfFont = "plex" | "geist" | "inter" | "jakarta" | "space" | "playfair" | "lora";
export type PdfLayout = "modern" | "corporate" | "creative" | "dark";

export type { Language, Currency };

export interface CustomTax {
  id: string;
  name: string;
  rate: number;
}

export interface LineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number | string;
  price: number | string;
}

export interface SavedService {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  currency?: Currency;
  usageCount?: number;
  lastUsedAt?: number;
}

export interface SavedClient {
  id: string;
  name: string;
  usageCount?: number;
  lastUsedAt?: number;
}

export interface Profile {
  id: string;
  profileName: string;
  companyName: string;
  contactInfo: string;
  logoBase64: string;
}

export interface InvoiceData {
  title?: string;
  clientName: string;
  date: string;
  notes: string;
  kdvRate: number;
  taxName?: string;
  taxId?: string;
  billingType?: BillingType;
  billingCycle?: BillingCycle;
  periodStart?: string;
  periodEnd?: string;
  autoRenewal?: boolean;
  showNotes?: boolean;
  showPaymentInfo?: boolean;
  bankName?: string;
  iban?: string;
  accountHolder?: string;
  showDiscount?: boolean;
  discountRate?: number;
  pdfFont?: PdfFont;
  pdfLayout?: PdfLayout;
}

/** A finished quote kept in localStorage so it can be reopened later. */
export interface SavedQuote {
  id: string;
  quoteNumber: string;
  clientName: string;
  title?: string;
  date: string;
  total: number;
  currency: Currency;
  language: Language;
  profileId: string;
  itemCount: number;
  savedAt: number;
  invoiceData: InvoiceData;
  lineItems: LineItem[];
}
