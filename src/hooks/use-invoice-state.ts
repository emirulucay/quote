import { useState, useEffect, useRef, useCallback } from "react";
import {
  Profile,
  LineItem,
  SavedService,
  SavedClient,
  SavedQuote,
  InvoiceData,
  CustomTax,
  ServicesLayout,
} from "../types";
import { Language, Currency, TRANSLATIONS } from "../lib/i18n";
import { STORAGE_KEYS, safeGetItem, safeGetJSON, safeSetJSON } from "../lib/storage";
import { toast } from "sonner";

export const DEFAULT_COMPANY_LOGO = "";
export const DEFAULT_CLIENT_LOGO = "https://images.pexels.com/photos/19023561/pexels-photo-19023561.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const LEGACY_DEFAULT_NOTE = "Bizi tercih ettiğiniz için teşekkür ederiz.";
const MAX_HISTORY_ENTRIES = 5;
const MAX_SAVED_CLIENTS = 40;
const DOCUMENT_TITLE_TRANSLATIONS: Record<Language, Record<string, string>> = {
  tr: {
    "SERVICE SUMMARY": "HİZMET ÖZETİ",
    "PRICE QUOTE": "FİYAT TEKLİFİ",
    "PROFORMA INVOICE": "PROFORMA FATURA",
    "PROJECT PROPOSAL": "PROJE TEKLİFİ",
    "SUBSCRIPTION QUOTE": "ABONELİK & HİZMET TEKLİFİ",
  },
  en: {
    "HİZMET ÖZETİ": "SERVICE SUMMARY",
    "FİYAT TEKLİFİ": "PRICE QUOTE",
    "PROFORMA FATURA": "PROFORMA INVOICE",
    "PROJE TEKLİFİ": "PROJECT PROPOSAL",
    "ABONELİK & HİZMET TEKLİFİ": "SUBSCRIPTION QUOTE",
  },
};

export const getDefaultTaxes = (lang: Language): CustomTax[] => [
  { id: "tax-0", name: lang === "en" ? "VAT" : "KDV", rate: 0 },
  { id: "tax-10", name: lang === "en" ? "VAT" : "KDV", rate: 10 },
  { id: "tax-20", name: lang === "en" ? "VAT" : "KDV", rate: 20 },
];

export const DEFAULT_TAXES = getDefaultTaxes("tr");

const getInitialDate = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const getFutureDate = (monthsToAdd = 12) => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsToAdd);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const SESSION_DRAFT_KEY = "quote-session-draft";
const SESSION_LINE_ITEMS_KEY = "quote-session-line-items";

const readSessionDraft = (): Partial<InvoiceData> | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Partial<InvoiceData>) : null;
  } catch {
    return null;
  }
};

const writeSessionDraft = (draft: Partial<InvoiceData>) => {
  try {
    sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error("Failed to save session draft", e);
  }
};

/**
 * Reserves the next quote number and persists the counter immediately, so two
 * quotes can never share a number. Restarts at 001 each calendar year.
 */
const mintQuoteNumber = (): string => {
  const year = new Date().getFullYear();
  const counter = safeGetJSON<{ year: number; seq: number }>(STORAGE_KEYS.numberCounter, { year: 0, seq: 0 });
  const seq = counter.year === year ? (Number(counter.seq) || 0) + 1 : 1;
  safeSetJSON(STORAGE_KEYS.numberCounter, { year, seq });
  return `${year}-${String(seq).padStart(3, "0")}`;
};

const emptyInvoiceData: InvoiceData = {
  title: "",
  clientName: "Ahmet Yılmaz",
  date: getInitialDate(),
  notes: "",
  kdvRate: 0,
  taxName: "KDV",
  taxId: "tax-0",
  billingType: "one-time",
  billingCycle: "yearly",
  periodStart: getInitialDate(),
  periodEnd: getFutureDate(12),
  autoRenewal: true,
  showNotes: true,
  showPaymentInfo: false,
  bankName: "",
  iban: "",
  accountHolder: "",
  showDiscount: false,
  discountRate: 0,
  pdfFont: "plex",
  pdfLayout: "modern",
};

export function useInvoiceState() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(emptyInvoiceData);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [language, setLanguageState] = useState<Language>("tr");
  const [currency, setCurrencyState] = useState<Currency>("TRY");
  const [servicesLayout, setServicesLayoutState] = useState<ServicesLayout>("inline");
  const [hasChosenServicesLayout, setHasChosenServicesLayout] = useState<boolean>(false);
  const [customTaxes, setCustomTaxes] = useState<CustomTax[]>([]);
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<SavedQuote[]>([]);

  // Kept in a ref so `persist` stays referentially stable across renders.
  const languageRef = useRef<Language>("tr");
  const quotaWarnedRef = useRef(false);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  /**
   * Persists to localStorage and surfaces a quota failure once per session.
   * Without this, a full store silently drops every subsequent write.
   */
  const persist = useCallback((key: string, value: unknown) => {
    const result = safeSetJSON(key, value);
    if (!result.ok && result.quotaExceeded && !quotaWarnedRef.current) {
      quotaWarnedRef.current = true;
      toast.error(
        languageRef.current === "tr"
          ? "Tarayıcı depolama alanı doldu. Yeni kayıtlar saklanamıyor — geçmişten eski teklifleri silin."
          : "Browser storage is full. New data can't be saved — delete old quotes from history."
      );
    }
    return result;
  }, []);

  useEffect(() => {
    // Load preferences
    let layoutFromPrefs: ServicesLayout | null = null;
    const savedPrefs = safeGetJSON<{ language?: string; currency?: string; servicesLayout?: string } | null>(
      STORAGE_KEYS.preferences,
      null
    );
    if (savedPrefs) {
      if (savedPrefs.language === "tr" || savedPrefs.language === "en") {
        setLanguageState(savedPrefs.language);
        languageRef.current = savedPrefs.language;
      }
      if (savedPrefs.currency && ["TRY", "USD", "EUR", "GBP"].includes(savedPrefs.currency)) {
        setCurrencyState(savedPrefs.currency as Currency);
      }
      if (savedPrefs.servicesLayout === "inline" || savedPrefs.servicesLayout === "tabs") {
        layoutFromPrefs = savedPrefs.servicesLayout;
      }
    }

    const savedLayout = safeGetItem(STORAGE_KEYS.servicesLayout);
    if (savedLayout === "inline" || savedLayout === "tabs") {
      layoutFromPrefs = savedLayout;
    }

    if (layoutFromPrefs) {
      setServicesLayoutState(layoutFromPrefs);
      setHasChosenServicesLayout(true);
    } else {
      setHasChosenServicesLayout(false);
    }

    // Load custom taxes
    const savedCustomTaxes = safeGetJSON<CustomTax[]>(STORAGE_KEYS.customTaxes, []);
    if (Array.isArray(savedCustomTaxes)) setCustomTaxes(savedCustomTaxes);

    // Assemble the invoice from persistent preferences + this tab's draft.
    let nextInvoiceData: InvoiceData = { ...emptyInvoiceData };

    const creationPrefs = safeGetJSON<Partial<InvoiceData> | null>(STORAGE_KEYS.creationPreferences, null);
    if (creationPrefs && typeof creationPrefs === "object") {
      nextInvoiceData = {
        ...nextInvoiceData,
        ...creationPrefs,
        notes: creationPrefs.notes === LEGACY_DEFAULT_NOTE ? "" : (creationPrefs.notes ?? nextInvoiceData.notes),
      };
    }

    const sessionDraft = readSessionDraft();
    if (sessionDraft) {
      nextInvoiceData = { ...nextInvoiceData, ...sessionDraft };
    }

    setInvoiceData(nextInvoiceData);

    // Load in-progress / draft services from sessionStorage
    try {
      const sessionLineItems = sessionStorage.getItem(SESSION_LINE_ITEMS_KEY);
      if (sessionLineItems) {
        const parsed = JSON.parse(sessionLineItems);
        if (Array.isArray(parsed)) setLineItems(parsed);
      }
    } catch (e) {
      console.error("Failed to parse session line items", e);
    }

    // Load saved services (strictly user-saved services only)
    const parsedServices = safeGetJSON<SavedService[]>(STORAGE_KEYS.savedServices, []);
    setSavedServices(
      Array.isArray(parsedServices)
        ? parsedServices.filter((s) => s.id && !s.id.startsWith("preset-"))
        : []
    );

    // Load saved clients & quote history
    const parsedClients = safeGetJSON<SavedClient[]>(STORAGE_KEYS.savedClients, []);
    setSavedClients(Array.isArray(parsedClients) ? parsedClients.filter((c) => c.id && c.name) : []);

    const parsedHistory = safeGetJSON<SavedQuote[]>(STORAGE_KEYS.history, []);
    setQuoteHistory(
      Array.isArray(parsedHistory)
        ? parsedHistory.filter((q) => q && q.id && Array.isArray(q.lineItems) && q.invoiceData)
        : []
    );

    // Load profiles
    const parsed = safeGetJSON<Profile[]>(STORAGE_KEYS.profiles, []);
    const savedActiveProfileId = safeGetItem(STORAGE_KEYS.activeProfileId);
    const validProfiles = Array.isArray(parsed) ? parsed.filter((p) => p.id !== "default") : [];
    if (validProfiles.length > 0) {
      setProfiles(validProfiles);
      const found = validProfiles.some((p) => p.id === savedActiveProfileId);
      setActiveProfileId(found && savedActiveProfileId ? savedActiveProfileId : validProfiles[0].id);
    } else {
      setProfiles([]);
      setActiveProfileId("");
    }

    setIsLoaded(true);
  }, []);

  // Save persistent quote creation preferences in localStorage
  useEffect(() => {
    if (isLoaded) {
      const persistentPreferences = {
        title: invoiceData.title,
        pdfFont: invoiceData.pdfFont,
        pdfLayout: invoiceData.pdfLayout,
        billingType: invoiceData.billingType,
        billingCycle: invoiceData.billingCycle,
        autoRenewal: invoiceData.autoRenewal,
        kdvRate: invoiceData.kdvRate,
        taxName: invoiceData.taxName,
        taxId: invoiceData.taxId,
        showNotes: invoiceData.showNotes,
        notes: invoiceData.notes,
        showPaymentInfo: invoiceData.showPaymentInfo,
        bankName: invoiceData.bankName,
        iban: invoiceData.iban,
        accountHolder: invoiceData.accountHolder,
        showDiscount: invoiceData.showDiscount,
        discountRate: invoiceData.discountRate,
      };
      persist(STORAGE_KEYS.creationPreferences, persistentPreferences);

      // Save in-progress session draft (client info, specific dates) in sessionStorage
      writeSessionDraft({
        clientName: invoiceData.clientName,
        date: invoiceData.date,
        periodStart: invoiceData.periodStart,
        periodEnd: invoiceData.periodEnd,
      });
    }
  }, [invoiceData, isLoaded, persist]);

  // Save in-progress / draft services in sessionStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        sessionStorage.setItem(SESSION_LINE_ITEMS_KEY, JSON.stringify(lineItems));
      } catch (e) {
        console.error("Failed to save session line items", e);
      }
    }
  }, [lineItems, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      persist(STORAGE_KEYS.profiles, profiles);
      if (activeProfileId) {
        persist(STORAGE_KEYS.activeProfileId, activeProfileId);
      }
    }
  }, [profiles, activeProfileId, isLoaded, persist]);

  useEffect(() => {
    if (isLoaded) {
      persist(STORAGE_KEYS.preferences, { language, currency, servicesLayout });
      if (hasChosenServicesLayout) {
        persist(STORAGE_KEYS.servicesLayout, servicesLayout);
      }
    }
  }, [language, currency, servicesLayout, hasChosenServicesLayout, isLoaded, persist]);

  useEffect(() => {
    if (isLoaded) persist(STORAGE_KEYS.customTaxes, customTaxes);
  }, [customTaxes, isLoaded, persist]);

  useEffect(() => {
    if (isLoaded) persist(STORAGE_KEYS.savedServices, savedServices);
  }, [savedServices, isLoaded, persist]);

  useEffect(() => {
    if (isLoaded) persist(STORAGE_KEYS.savedClients, savedClients);
  }, [savedClients, isLoaded, persist]);

  useEffect(() => {
    if (isLoaded) persist(STORAGE_KEYS.history, quoteHistory);
  }, [quoteHistory, isLoaded, persist]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setInvoiceData((prev) => {
      const isDefaultTax = !prev.taxId || prev.taxId.startsWith("tax-") || prev.taxName === "KDV" || prev.taxName === "VAT" || prev.taxName === "VAT / Tax";
      return {
        ...prev,
        taxName: isDefaultTax ? (lang === "en" ? "VAT" : "KDV") : prev.taxName,
        title: prev.title ? (DOCUMENT_TITLE_TRANSLATIONS[lang][prev.title] ?? prev.title) : prev.title,
      };
    });
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
  };

  const setServicesLayout = (layout: ServicesLayout) => {
    setServicesLayoutState(layout);
    setHasChosenServicesLayout(true);
    persist(STORAGE_KEYS.servicesLayout, layout);
  };

  const addCustomTax = (name: string, rate: number) => {
    const newTax: CustomTax = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      rate,
    };
    setCustomTaxes((prev) => [...prev, newTax]);
    return newTax;
  };

  const saveOrUpdateServices = (itemsToSave: LineItem[], targetCurrency?: Currency) => {
    const curr = targetCurrency || currency;
    setSavedServices((prev) => {
      const next = [...prev];
      for (const item of itemsToSave) {
        const name = item.name.trim();
        const priceNum = Number(item.price);
        if (!name || isNaN(priceNum) || priceNum <= 0) continue;

        const existingIndex = next.findIndex(
          (s) => s.name.trim().toLowerCase() === name.toLowerCase() && (s.currency === curr || !s.currency)
        );

        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            name,
            price: priceNum,
            description: item.description?.trim() || next[existingIndex].description,
            currency: curr,
            usageCount: (next[existingIndex].usageCount || 0) + 1,
            lastUsedAt: Date.now(),
          };
        } else {
          next.unshift({
            id: `saved-${crypto.randomUUID()}`,
            name,
            description: item.description?.trim() || "",
            price: priceNum,
            currency: curr,
            usageCount: 1,
            lastUsedAt: Date.now(),
          });
        }
      }
      return next.slice(0, 35);
    });
  };

  const deleteSavedService = (id: string) => {
    setSavedServices((prev) => prev.filter((s) => s.id !== id));
  };

  /** Remembers a client name so it can be offered as a suggestion next time. */
  const saveClient = (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    setSavedClients((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex((c) => c.name.trim().toLowerCase() === name.toLowerCase());
      if (existingIndex >= 0) {
        next[existingIndex] = {
          ...next[existingIndex],
          name,
          usageCount: (next[existingIndex].usageCount || 0) + 1,
          lastUsedAt: Date.now(),
        };
      } else {
        next.unshift({
          id: `client-${crypto.randomUUID()}`,
          name,
          usageCount: 1,
          lastUsedAt: Date.now(),
        });
      }
      return next
        .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
        .slice(0, MAX_SAVED_CLIENTS);
    });
  };

  const deleteSavedClient = (id: string) => {
    setSavedClients((prev) => prev.filter((c) => c.id !== id));
  };

  /**
   * Archives the current quote. Each export is its own entry, so only the last
   * MAX_HISTORY_ENTRIES downloads are kept.
   */
  const saveQuoteToHistory = (total: number) => {
    const quoteNumber = mintQuoteNumber();
    const entry: SavedQuote = {
      id: `quote-${crypto.randomUUID()}`,
      quoteNumber,
      clientName: invoiceData.clientName?.trim() || "",
      title: invoiceData.title,
      date: invoiceData.date,
      total,
      currency,
      language,
      profileId: activeProfileId,
      itemCount: lineItems.length,
      savedAt: Date.now(),
      invoiceData: { ...invoiceData },
      lineItems: lineItems.map((item) => ({ ...item })),
    };

    setQuoteHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES));

    return entry;
  };

  const deleteQuoteFromHistory = (id: string) => {
    setQuoteHistory((prev) => prev.filter((q) => q.id !== id));
  };

  const clearQuoteHistory = () => {
    setQuoteHistory([]);
  };

  /** Reopens an archived quote, restoring its items, currency and profile. */
  const loadQuoteFromHistory = (quote: SavedQuote) => {
    setInvoiceData({ ...emptyInvoiceData, ...quote.invoiceData });
    setLineItems(quote.lineItems.map((item) => ({ ...item })));
    if (quote.currency) setCurrencyState(quote.currency);
    if (quote.language) setLanguageState(quote.language);
    if (quote.profileId && profiles.some((p) => p.id === quote.profileId)) {
      setActiveProfileId(quote.profileId);
    }
  };

  /** Clears the working quote; profile and document settings are kept. */
  const startNewQuote = () => {
    setLineItems([]);
    setInvoiceData((prev) => ({
      ...prev,
      clientName: "",
      date: getInitialDate(),
      periodStart: getInitialDate(),
      periodEnd: getFutureDate(12),
    }));
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

  const updateProfile = (id: string, data: Partial<Profile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deleteProfile = (id: string) => {
    const next = profiles.filter((profile) => profile.id !== id);
    setProfiles(next);
    if (activeProfileId === id) setActiveProfileId(next[0]?.id || "");
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.tr;

  const saveAsNewProfile = (data: Partial<Profile>) => {
    const newId = crypto.randomUUID();
    const newProfile: Profile = {
      id: newId,
      profileName: data.companyName || data.profileName || `${t.newProfileTitle} (${profiles.length + 1})`,
      companyName: data.companyName || "",
      contactInfo: data.contactInfo || "",
      logoBase64: data.logoBase64 || DEFAULT_COMPANY_LOGO,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
    toast.success(t.profileCreated);
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", description: "", quantity: 1, price: "" },
    ]);
  };

  const updateLineItem = (id: string, data: Partial<LineItem>) => {
    setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Combine default (translated) + custom taxes
  const allTaxes: CustomTax[] = [...getDefaultTaxes(language), ...customTaxes];

  return {
    isLoaded,
    profiles,
    activeProfileId,
    setActiveProfileId,
    activeProfile,
    updateProfile,
    deleteProfile,
    saveAsNewProfile,
    invoiceData,
    setInvoiceData,
    lineItems,
    addLineItem,
    updateLineItem,
    removeLineItem,
    language,
    setLanguage,
    currency,
    setCurrency,
    servicesLayout,
    setServicesLayout,
    hasChosenServicesLayout,
    customTaxes,
    allTaxes,
    addCustomTax,
    savedServices,
    saveOrUpdateServices,
    deleteSavedService,
    savedClients,
    saveClient,
    deleteSavedClient,
    quoteHistory,
    saveQuoteToHistory,
    deleteQuoteFromHistory,
    clearQuoteHistory,
    loadQuoteFromHistory,
    startNewQuote,
    t,
  };
}
