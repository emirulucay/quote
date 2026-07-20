export interface LineItem {
  id: string;
  name: string;
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
}
