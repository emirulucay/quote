export type Language = "tr" | "en";
export type Currency = "TRY" | "USD" | "EUR" | "GBP";

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  TRY: { code: "TRY", symbol: "₺", label: "Türk Lirası (₺)", locale: "tr-TR" },
  USD: { code: "USD", symbol: "$", label: "US Dollar ($)", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", label: "Euro (€)", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", label: "British Pound (£)", locale: "en-GB" },
};

export const TRANSLATIONS = {
  tr: {
    // Onboarding
    onboardingStep1Title: "Dil ve Para Birimi",
    onboardingStep1Desc: "Fatura ve tekliflerinizde kullanılacak varsayılan dili ve para birimini seçin.",
    languageLabel: "Uygulama Dili",
    currencyLabel: "Para Birimi",
    continueButton: "Devam Et",
    backButton: "Geri",
    onboardingStep2Title: "Hoş Geldiniz",
    onboardingStep2Desc: "Fatura oluşturmaya başlamak için önce şirketinizi veya serbest çalışan profilinizi oluşturun.",
    profileNameLabel: "Profil Adı (Sizin için)",
    profileNamePlaceholder: "Örn: Freelance İşim",
    companyNameLabel: "Faturada Görünecek Şirket / Adınız *",
    companyNamePlaceholder: "Ad Soyad veya Şirket",
    contactInfoLabel: "İletişim Bilgileri",
    contactInfoPlaceholder: "Email, Telefon, Adres",
    footerPreviewTitle: "Fatura Altbilgisi Canlı Önizleme",
    getStartedButton: "Hemen Başla",

    // Profile & Settings Panel
    profileSectionTitle: "Profil",
    selectProfilePlaceholder: "Profil Seçin",
    addNewProfile: "Yeni Ekle",
    changeLogo: "Logoyu Değiştir",
    noLogo: "Logo Yok",
    preferencesTitle: "Tercihler",
    
    // Invoice Form
    invoiceDetailsTitle: "Fatura Detayları",
    dateLabel: "Tarih",
    selectDatePlaceholder: "Tarih Seçin",
    kdvLabel: "Vergi Oranı",
    kdvNone: "Vergi Yok (%0)",
    kdv10: "%10 KDV",
    kdv20: "%20 KDV",
    addCustomTaxOption: "+ Özel Vergi Ekle...",
    customTaxModalTitle: "Özel Vergi Ekle",
    customTaxNameLabel: "Vergi Adı",
    customTaxNamePlaceholder: "Örn: Sales Tax, GST, Stopaj, MwSt",
    customTaxRateLabel: "Vergi Oranı (%)",
    customTaxRatePlaceholder: "Örn: 8.875 veya 18",
    addTaxButton: "Vergiyi Kaydet",
    clientNameLabel: "Müşteri Adı",
    clientNamePlaceholder: "Ahmet Yılmaz",

    // Line Items
    servicesTitle: "Hizmetler",
    serviceNamePlaceholder: "Hizmet Adı",
    serviceDescriptionPlaceholder: "Açıklama ekle (isteğe bağlı)",
    quantityPlaceholder: "Adet",
    pricePlaceholder: "Fiyat",
    addServiceButton: "Hizmet Ekle",
    maxLimitReached: "Maksimum Hizmet Sınırı (7)",

    // Actions
    downloadPdfButton: "PDF Olarak İndir",
    newProfileTitle: "Yeni Profil Oluştur",
    cancelButton: "İptal",
    saveButton: "Kaydet",

    // Invoice Preview & PDF
    documentTitle: "HİZMET ÖZETİ",
    clientHeader: "SAYIN",
    thService: "HİZMET",
    thQuantity: "MİKTAR",
    thPrice: "FİYAT",
    thTotal: "TOPLAM",
    noServicesAdded: "Henüz hizmet eklenmedi.",
    unnamedService: "İsimsiz Hizmet",
    subtotalLabel: "Ara Toplam",
    kdvTaxLabel: "KDV",
    totalLabel: "GENEL TOPLAM",

    // Support Modal
    supportTitle: "Tebrikler!",
    supportDesc: "Teklif dosyanız başarıyla indirildi. Eğer bu ücretsiz aracı faydalı bulduysanız, geliştiriciye ufak bir destek olmak ister misiniz?",
    buyCoffee: "Geliştiriciye Kahve Ismarla",
    starGithub: "GitHub'da Yıldızla",
    maybeLater: "Belki daha sonra",

    // Toasts
    logoUpdated: "Logo güncellendi",
    profileCreated: "Yeni profil oluşturuldu",
  },
  en: {
    // Onboarding
    onboardingStep1Title: "Language & Currency",
    onboardingStep1Desc: "Select the default language and currency to be used in your quotes and invoices.",
    languageLabel: "Application Language",
    currencyLabel: "Currency",
    continueButton: "Continue",
    backButton: "Back",
    onboardingStep2Title: "Welcome",
    onboardingStep2Desc: "Create your company or freelancer profile to get started with creating invoices.",
    profileNameLabel: "Profile Name (For you)",
    profileNamePlaceholder: "e.g. My Freelance Work",
    companyNameLabel: "Company / Your Name on Invoice *",
    companyNamePlaceholder: "Full Name or Company Name",
    contactInfoLabel: "Contact Information",
    contactInfoPlaceholder: "Email, Phone, Address",
    footerPreviewTitle: "Invoice Footer Live Preview",
    getStartedButton: "Get Started",

    // Profile & Settings Panel
    profileSectionTitle: "Profile",
    selectProfilePlaceholder: "Select Profile",
    addNewProfile: "Add New",
    changeLogo: "Change Logo",
    noLogo: "No Logo",
    preferencesTitle: "Preferences",

    // Invoice Form
    invoiceDetailsTitle: "Invoice Details",
    dateLabel: "Date",
    selectDatePlaceholder: "Select Date",
    kdvLabel: "Tax Rate",
    kdvNone: "No Tax (0%)",
    kdv10: "10% Tax",
    kdv20: "20% Tax",
    addCustomTaxOption: "+ Add Custom Tax...",
    customTaxModalTitle: "Add Custom Tax",
    customTaxNameLabel: "Tax Name",
    customTaxNamePlaceholder: "e.g. Sales Tax, GST, MwSt",
    customTaxRateLabel: "Tax Rate (%)",
    customTaxRatePlaceholder: "e.g. 8.875 or 18",
    addTaxButton: "Save Tax",
    clientNameLabel: "Client Name",
    clientNamePlaceholder: "John Doe",

    // Line Items
    servicesTitle: "Services",
    serviceNamePlaceholder: "Service Name",
    serviceDescriptionPlaceholder: "Add a description (optional)",
    quantityPlaceholder: "Qty",
    pricePlaceholder: "Price",
    addServiceButton: "Add Service",
    maxLimitReached: "Maximum Service Limit (7)",

    // Actions
    downloadPdfButton: "Download PDF",
    newProfileTitle: "Create New Profile",
    cancelButton: "Cancel",
    saveButton: "Save",

    // Invoice Preview & PDF
    documentTitle: "SERVICE SUMMARY",
    clientHeader: "ATTN",
    thService: "SERVICE",
    thQuantity: "QTY",
    thPrice: "PRICE",
    thTotal: "TOTAL",
    noServicesAdded: "No services added yet.",
    unnamedService: "Unnamed Service",
    subtotalLabel: "Subtotal",
    kdvTaxLabel: "VAT / Tax",
    totalLabel: "GRAND TOTAL",

    // Support Modal
    supportTitle: "Congratulations!",
    supportDesc: "Your quote file has been downloaded successfully. If you found this free tool helpful, would you like to support the developer?",
    buyCoffee: "Buy Me a Coffee",
    starGithub: "Star on GitHub",
    maybeLater: "Maybe later",

    // Toasts
    logoUpdated: "Logo updated",
    profileCreated: "New profile created",
  },
};
