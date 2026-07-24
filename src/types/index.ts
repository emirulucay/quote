import { Language, Currency } from "../lib/i18n";

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
  clientName: string;
  date: string;
  notes: string;
  kdvRate: number;
  taxName?: string;
  taxId?: string;
}
