import { useState, useEffect } from "react";
import { Profile, LineItem, InvoiceData, CustomTax, ServicesLayout } from "../types";
import { Language, Currency, TRANSLATIONS } from "../lib/i18n";
import { toast } from "sonner";

export const DEFAULT_COMPANY_LOGO = "";
export const DEFAULT_CLIENT_LOGO = "https://images.pexels.com/photos/19023561/pexels-photo-19023561.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

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

const emptyInvoiceData: InvoiceData = {
  title: "",
  clientName: "Ahmet Yılmaz",
  date: getInitialDate(),
  notes: "Bizi tercih ettiğiniz için teşekkür ederiz.",
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
  showSignature: false,
  signatureTitle: "",
  showDueDate: false,
  dueDate: getFutureDate(1),
  pdfFont: "plex",
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

  useEffect(() => {
    // Load preferences
    let layoutFromPrefs: ServicesLayout | null = null;
    const savedPrefs = localStorage.getItem("quote-preferences");
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.language && (parsed.language === "tr" || parsed.language === "en")) {
          setLanguageState(parsed.language);
        }
        if (parsed.currency && ["TRY", "USD", "EUR", "GBP"].includes(parsed.currency)) {
          setCurrencyState(parsed.currency);
        }
        if (parsed.servicesLayout === "inline" || parsed.servicesLayout === "tabs") {
          layoutFromPrefs = parsed.servicesLayout;
        }
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }

    const savedLayout = localStorage.getItem("quote-services-layout");
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
    const savedCustomTaxes = localStorage.getItem("quote-custom-taxes");
    if (savedCustomTaxes) {
      try {
        const parsed = JSON.parse(savedCustomTaxes);
        if (Array.isArray(parsed)) {
          setCustomTaxes(parsed);
        }
      } catch (e) {
        console.error("Failed to parse custom taxes", e);
      }
    }

    // Load persistent quote creation preferences from localStorage
    const savedCreationPrefs = localStorage.getItem("quote-creation-preferences");
    if (savedCreationPrefs) {
      try {
        const parsed = JSON.parse(savedCreationPrefs);
        if (parsed && typeof parsed === "object") {
          setInvoiceData((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (e) {
        console.error("Failed to parse creation preferences", e);
      }
    }

    // Load in-progress / draft services from sessionStorage
    const sessionLineItems = sessionStorage.getItem("quote-session-line-items");
    if (sessionLineItems) {
      try {
        const parsed = JSON.parse(sessionLineItems);
        if (Array.isArray(parsed)) {
          setLineItems(parsed);
        }
      } catch (e) {
        console.error("Failed to parse session line items", e);
      }
    }

    // Load active session draft metadata (e.g. clientName / date override) if in sessionStorage
    const sessionDraft = sessionStorage.getItem("quote-session-draft");
    if (sessionDraft) {
      try {
        const parsed = JSON.parse(sessionDraft);
        if (parsed && typeof parsed === "object") {
          setInvoiceData((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (e) {
        console.error("Failed to parse session draft", e);
      }
    }

    // Load profiles
    const savedProfiles = localStorage.getItem("invoice-profiles");
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        const validProfiles = Array.isArray(parsed) ? parsed.filter((p) => p.id !== "default") : [];
        if (validProfiles.length > 0) {
          setProfiles(validProfiles);
          setActiveProfileId(validProfiles[0].id);
        } else {
          setProfiles([]);
          setActiveProfileId("");
        }
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save persistent quote creation preferences in localStorage
  useEffect(() => {
    if (isLoaded) {
      const persistentPreferences = {
        title: invoiceData.title,
        pdfFont: invoiceData.pdfFont,
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
        showSignature: invoiceData.showSignature,
        signatureTitle: invoiceData.signatureTitle,
        showDueDate: invoiceData.showDueDate,
      };
      localStorage.setItem("quote-creation-preferences", JSON.stringify(persistentPreferences));

      // Save in-progress session draft (client info, specific dates) in sessionStorage
      const sessionDraft = {
        clientName: invoiceData.clientName,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        periodStart: invoiceData.periodStart,
        periodEnd: invoiceData.periodEnd,
      };
      sessionStorage.setItem("quote-session-draft", JSON.stringify(sessionDraft));
    }
  }, [invoiceData, isLoaded]);

  // Save in-progress / draft services in sessionStorage
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("quote-session-line-items", JSON.stringify(lineItems));
    }
  }, [lineItems, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("invoice-profiles", JSON.stringify(profiles));
    }
  }, [profiles, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("quote-preferences", JSON.stringify({ language, currency, servicesLayout }));
      if (hasChosenServicesLayout) {
        localStorage.setItem("quote-services-layout", servicesLayout);
      }
    }
  }, [language, currency, servicesLayout, hasChosenServicesLayout, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("quote-custom-taxes", JSON.stringify(customTaxes));
    }
  }, [customTaxes, isLoaded]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setInvoiceData((prev) => {
      const isDefaultTax = !prev.taxId || prev.taxId.startsWith("tax-") || prev.taxName === "KDV" || prev.taxName === "VAT" || prev.taxName === "VAT / Tax";
      return {
        ...prev,
        taxName: isDefaultTax ? (lang === "en" ? "VAT" : "KDV") : prev.taxName,
      };
    });
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
  };

  const setServicesLayout = (layout: ServicesLayout) => {
    setServicesLayoutState(layout);
    setHasChosenServicesLayout(true);
    localStorage.setItem("quote-services-layout", layout);
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
    t,
  };
}
