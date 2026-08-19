import { Language, Currency } from "../lib/i18n";

export type ServicesLayout = "inline" | "tabs";
export type BillingType = "one-time" | "subscription";
export type BillingCycle = "monthly" | "yearly" | "quarterly";
export type PdfFont = "plex" | "geist" | "inter" | "jakarta" | "space" | "playfair" | "lora";

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
  showSignature?: boolean;
  signatureTitle?: string;
  showDueDate?: boolean;
  dueDate?: string;
  pdfFont?: PdfFont;
}
