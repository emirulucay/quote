"use client";

import Image from "next/image";
import { useRef, useState, ChangeEvent } from "react";
import { QuoteLogo } from "@/components/quote-logo";
import { useInvoiceState } from "@/hooks/use-invoice-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Minus, Download, Upload, X, Coffee, Heart, Globe, Coins, ArrowLeft, ArrowRight, Check, ShieldCheck, Pencil, LayoutList, Columns2, Sparkles, RefreshCw, Building2, Percent, PenTool, CalendarClock, FileText, Type, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DEFAULT_COMPANY_LOGO } from "@/hooks/use-invoice-state";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CURRENCIES, Language, Currency } from "@/lib/i18n";
import { ServicesLayout, BillingType, BillingCycle, PdfFont } from "@/types";

const getPdfFontClass = (font?: PdfFont) => {
  switch (font) {
    case "geist":
      return "font-pdf-geist";
    case "inter":
      return "font-pdf-inter";
    case "jakarta":
      return "font-pdf-jakarta";
    case "space":
      return "font-pdf-space";
    case "playfair":
      return "font-pdf-playfair";
    case "lora":
      return "font-pdf-lora";
    case "plex":
    default:
      return "font-pdf-plex";
  }
};

const PDF_FONTS: { id: PdfFont; labelKey: string; subKey: string; fontClass: string; sample: string }[] = [
  { id: "plex", labelKey: "fontPlex", subKey: "fontPlexSub", fontClass: "font-pdf-plex", sample: "Aa" },
  { id: "geist", labelKey: "fontGeist", subKey: "fontGeistSub", fontClass: "font-pdf-geist", sample: "Aa" },
  { id: "inter", labelKey: "fontInter", subKey: "fontInterSub", fontClass: "font-pdf-inter", sample: "Aa" },
  { id: "jakarta", labelKey: "fontJakarta", subKey: "fontJakartaSub", fontClass: "font-pdf-jakarta", sample: "Aa" },
  { id: "space", labelKey: "fontSpace", subKey: "fontSpaceSub", fontClass: "font-pdf-space", sample: "Aa" },
  { id: "playfair", labelKey: "fontPlayfair", subKey: "fontPlayfairSub", fontClass: "font-pdf-playfair", sample: "Aa" },
  { id: "lora", labelKey: "fontLora", subKey: "fontLoraSub", fontClass: "font-pdf-lora", sample: "Aa" },
];

const DockPopoverCloseButton = ({ language }: { language: Language }) => (
  <PopoverClose asChild>
    <button
      type="button"
      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white text-black/42 transition-colors hover:border-black/15 hover:bg-black/5 hover:text-black"
      aria-label={language === "tr" ? "Paneli kapat" : "Close panel"}
      title={language === "tr" ? "Kapat" : "Close"}
    >
      <X className="size-3.5" />
    </button>
  </PopoverClose>
);

const DockPopoverFooter = ({ language }: { language: Language }) => (
  <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/8 pt-3">
    <span className="text-[9px] leading-4 text-black/35">
      {language === "tr" ? "Dışarı tıklayarak veya Esc ile de kapatabilirsiniz." : "You can also click outside or press Esc to close."}
    </span>
    <PopoverClose asChild>
      <button type="button" className="h-8 shrink-0 rounded-full bg-[#171815] px-4 text-[10px] font-semibold text-white transition-colors hover:bg-black">
        {language === "tr" ? "Tamam" : "Done"}
      </button>
    </PopoverClose>
  </div>
);

const getFutureDate = (monthsToAdd = 12) => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsToAdd);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const formatCurrency = (value: number, curr: Currency = "TRY") => {
  const config = CURRENCIES[curr] || CURRENCIES.TRY;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
  }).format(value);
};

const parseTrDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  return new Date();
};

const createSlug = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ıi]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function AppPage() {
  const state = useInvoiceState();
  const printRef = useRef<HTMLDivElement>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [confirmingProfileDelete, setConfirmingProfileDelete] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<"details" | "services">("details");
  const [expandedDescriptions, setExpandedDescriptions] = useState<string[]>([]);
  const [previewZoom, setPreviewZoom] = useState(90);

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newContactInfo, setNewContactInfo] = useState("");
  const [newLogoBase64, setNewLogoBase64] = useState("");

  const [showTaxModal, setShowTaxModal] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");

  if (!state.isLoaded) return null;

  const {
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
  } = state;

  const forceProfileCreation = profiles.length === 0;

  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const discountRate = invoiceData.showDiscount ? Number(invoiceData.discountRate) || 0 : 0;
  const discountAmount = (subtotal * discountRate) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const kdvAmount = taxableBase * ((invoiceData.kdvRate || 0) / 100);
  const total = taxableBase + kdvAmount;

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDoc) => {
        const pdfContainer = clonedDoc.querySelector('.pdf-container');
        if (pdfContainer) {
          pdfContainer.classList.add('pdf-export');
        }
        const previewTransform = clonedDoc.querySelector<HTMLElement>('.pdf-preview-transform');
        if (previewTransform) {
          previewTransform.style.transform = 'none';
          previewTransform.style.transition = 'none';
        }
      }
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Force single page fit
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

    const clientSlug = createSlug(invoiceData.clientName);
    const fileName = clientSlug ? `teklif-${clientSlug}.pdf` : `teklif.pdf`;

    pdf.save(fileName);

    setTimeout(() => {
      const hasSeen = sessionStorage.getItem("hasSeenSupportModal");
      if (!hasSeen) {
        setShowSupportModal(true);
        sessionStorage.setItem("hasSeenSupportModal", "true");
      }
    }, 1500);
  };

  const handleCreateProfile = () => {
    const companyName = newCompanyName.trim();
    const contactInfo = newContactInfo.trim();

    if (companyName) {
      if (editingProfileId) {
        updateProfile(editingProfileId, { profileName: companyName, companyName, contactInfo, logoBase64: newLogoBase64 });
        toast.success(language === "tr" ? "Profil güncellendi" : "Profile updated");
      } else {
        saveAsNewProfile({ profileName: companyName, companyName, contactInfo, logoBase64: newLogoBase64 || DEFAULT_COMPANY_LOGO });
      }
      setNewCompanyName("");
      setNewContactInfo("");
      setNewLogoBase64("");
      setEditingProfileId(null);
      setConfirmingProfileDelete(false);
      setShowProfileModal(false);
    } else {
      toast.error(language === "tr" ? "Şirket/Ad kısmı zorunludur" : "Company / Your Name is required");
    }
  };

  const handleSaveCustomTax = () => {
    const name = newTaxName.trim() || "Vergi";
    const rate = Number(newTaxRate);
    if (!isNaN(rate) && rate >= 0) {
      const created = addCustomTax(name, rate);
      setInvoiceData({
        ...invoiceData,
        kdvRate: created.rate,
        taxName: created.name,
        taxId: created.id,
      });
      setNewTaxName("");
      setNewTaxRate("");
      setShowTaxModal(false);
      toast.success(language === "tr" ? "Özel vergi eklendi" : "Custom tax added");
    } else {
      toast.error(language === "tr" ? "Geçerli bir vergi oranı girin" : "Enter a valid tax rate");
    }
  };

  const handleProfileLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(language === "tr" ? "Lütfen bir görsel dosyası seçin" : "Please choose an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "tr" ? "Logo dosyası 5 MB'dan küçük olmalı" : "Logo must be smaller than 5 MB");
      e.target.value = "";
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoBase64(reader.result as string);
        toast.success(language === "tr" ? "Logo hazır" : "Logo ready");
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const renderProfileLogoUploader = (inputId: string) => (
    <div className="grid gap-2">
      <Label className="text-[11px] font-semibold text-black/52">{language === "tr" ? "Şirket logosu" : "Company logo"}</Label>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-black/12 bg-white/65 p-3.5 transition-colors hover:border-black/24 hover:bg-white">
        {newLogoBase64 ? (
          <Image src={newLogoBase64} alt={language === "tr" ? "Logo önizlemesi" : "Logo preview"} width={64} height={64} className="size-14 shrink-0 rounded-xl border border-black/8 bg-white object-contain" />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#f1efe9] text-black/30">
            <Upload className="size-4.5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-black/72">{newLogoBase64 ? (language === "tr" ? "Logo seçildi" : "Logo selected") : (language === "tr" ? "Logo ekleyin" : "Add a logo")}</p>
          <p className="mt-1 text-[10px] leading-4 text-black/36">{language === "tr" ? "PNG, JPG veya SVG · En fazla 5 MB" : "PNG, JPG or SVG · Up to 5 MB"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Label htmlFor={inputId} className="flex h-9 cursor-pointer items-center rounded-full border border-black/10 bg-white px-3 text-[10px] font-semibold text-black/60 transition-colors hover:border-black/20 hover:text-black">
            {newLogoBase64 ? (language === "tr" ? "Değiştir" : "Replace") : (language === "tr" ? "Yükle" : "Upload")}
          </Label>
          {newLogoBase64 && (
            <button type="button" onClick={() => setNewLogoBase64("")} className="flex size-9 items-center justify-center rounded-full border border-black/8 bg-white text-black/36 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600" aria-label={language === "tr" ? "Logoyu kaldır" : "Remove logo"} title={language === "tr" ? "Logoyu kaldır" : "Remove logo"}>
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        <Input id={inputId} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleProfileLogoUpload} className="hidden" />
      </div>
    </div>
  );

  // Services Layout Option Cards Component
  const renderLayoutOptionCards = (currentLayout: ServicesLayout, onSelect: (layout: ServicesLayout) => void) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Card 1: Stacked / Inline */}
      <button
        type="button"
        onClick={() => onSelect("inline")}
        className={cn(
          "group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer",
          currentLayout === "inline"
            ? "border-[#171815] bg-white shadow-[0_12px_28px_rgba(20,21,18,0.08)] ring-1 ring-[#171815]"
            : "border-black/9 bg-white/45 text-black/55 hover:border-black/25 hover:bg-white"
        )}
      >
        <div className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-black/5 text-primary">
                <LayoutList className="size-4" />
              </span>
              <span className="font-semibold text-sm sm:text-base text-primary">
                {t.layoutInlineTitle}
              </span>
            </div>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full transition-colors",
                currentLayout === "inline"
                  ? "bg-[#dff568] text-black"
                  : "border border-black/10 text-transparent"
              )}
            >
              <Check className="size-3.5" />
            </span>
          </div>

          {/* Mini Visual Diagram of Stacked Layout */}
          <div className="rounded-xl border border-black/8 bg-[#f5f3ee] p-3 space-y-2 mb-3.5 pointer-events-none select-none">
            <div className="rounded-lg bg-white p-2.5 border border-black/5 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="size-2 rounded-full bg-[#dff568]" />
                <span className="text-[10px] font-semibold text-black/65">{t.invoiceDetailsTitle}</span>
              </div>
              <div className="h-2 w-3/4 rounded-full bg-black/8 mb-1" />
              <div className="h-2 w-1/2 rounded-full bg-black/6" />
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-black/5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#dff568]" />
                  <span className="text-[10px] font-semibold text-black/65">{t.servicesTitle}</span>
                </div>
                <span className="text-[8px] font-mono text-black/40">3/7</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-black/8" />
                <div className="h-1.5 w-5/6 rounded-full bg-black/6" />
              </div>
            </div>
          </div>

          <p className="text-xs leading-5 text-black/50">
            {t.layoutInlineDesc}
          </p>
        </div>
      </button>

      {/* Card 2: Separate Tabs */}
      <button
        type="button"
        onClick={() => onSelect("tabs")}
        className={cn(
          "group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer",
          currentLayout === "tabs"
            ? "border-[#171815] bg-white shadow-[0_12px_28px_rgba(20,21,18,0.08)] ring-1 ring-[#171815]"
            : "border-black/9 bg-white/45 text-black/55 hover:border-black/25 hover:bg-white"
        )}
      >
        <div className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-black/5 text-primary">
                <Columns2 className="size-4" />
              </span>
              <span className="font-semibold text-sm sm:text-base text-primary">
                {t.layoutTabsTitle}
              </span>
            </div>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full transition-colors",
                currentLayout === "tabs"
                  ? "bg-[#dff568] text-black"
                  : "border border-black/10 text-transparent"
              )}
            >
              <Check className="size-3.5" />
            </span>
          </div>

          {/* Mini Visual Diagram of Tabs Layout */}
          <div className="rounded-xl border border-black/8 bg-[#f5f3ee] p-3 space-y-2 mb-3.5 pointer-events-none select-none">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/6 p-1">
              <div className="rounded-md bg-white py-1 px-1.5 text-center text-[9px] font-semibold text-black shadow-xs flex items-center justify-center gap-1">
                <span className="size-1.5 rounded-full bg-[#dff568]" />
                {language === "tr" ? "01 Detay" : "01 Details"}
              </div>
              <div className="rounded-md py-1 px-1.5 text-center text-[9px] font-medium text-black/40">
                {language === "tr" ? "02 Hizmet" : "02 Items"}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-black/5 shadow-xs">
              <div className="h-2 w-4/5 rounded-full bg-black/8 mb-1.5" />
              <div className="h-2 w-3/5 rounded-full bg-black/6 mb-1.5" />
              <div className="h-2 w-2/5 rounded-full bg-[#dff568]/70" />
            </div>
          </div>

          <p className="text-xs leading-5 text-black/50">
            {t.layoutTabsDesc}
          </p>
        </div>
      </button>
    </div>
  );

  // Live Footer Preview Component for Modals & Onboarding
  const renderFooterPreview = () => (
    <div className="flex flex-col gap-2 mt-1">
      <Label lang="en" className="text-[10px] text-black/35 font-semibold uppercase tracking-[0.12em]">
        {t.footerPreviewTitle}
      </Label>
      <div className="flex items-start gap-3 rounded-2xl border border-black/8 border-l-2 border-l-[#dff568] bg-[#f5f3ee] p-4">
        {newLogoBase64 && <Image src={newLogoBase64} alt="" width={44} height={44} className="size-11 shrink-0 rounded-lg border border-black/8 bg-white object-contain" />}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            {newCompanyName || (language === "tr" ? "Ad Soyad / Şirket" : "Full Name or Company Name")}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-black/42">
            {newContactInfo || (language === "tr" ? "Email: info@sirket.com\nTel: +90 555 123 4567\nAdres: İstanbul, Türkiye" : "Email: info@company.com\nPhone: +1 555 123 4567\nAddress: New York, USA")}
          </p>
        </div>
      </div>
    </div>
  );

  // STEP 1, STEP 2 & STEP 3 ONBOARDING
  if (forceProfileCreation) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#f5f3ee] p-3 font-plex sm:p-5 lg:p-7">
        <div className="pointer-events-none absolute -left-40 -top-48 size-[38rem] rounded-full bg-[#dff568]/35 blur-[120px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[1.75rem] border border-black/8 bg-white shadow-[0_30px_100px_rgba(20,21,18,0.12)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="relative hidden overflow-hidden bg-[#171815] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -left-28 top-20 size-96 rounded-full bg-[#dff568]/18 blur-[90px]" />
            <div className="relative"><QuoteLogo className="h-7 w-auto brightness-0 invert" /></div>
            <div className="relative">
              <p lang="en" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#dff568]">
                {language === "tr" ? "Bir kez ayarla, hızla teklif hazırla" : "Set up once, quote faster"}
              </p>
              <h2 className="mt-6 max-w-md text-5xl font-medium leading-[1.02] tracking-[-0.05em] !text-white xl:text-6xl">
                {language === "tr" ? "Sıradaki teklifin burada başlıyor." : "Your next quote starts here."}
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-6 text-white/50">
                {language === "tr" ? "Çalışma alanınızı üç kısa adımda hazırlayın. Bilgileriniz yalnızca bu tarayıcıda saklanır." : "Set up your workspace in three quick steps. Your information stays in this browser."}
              </p>
            </div>
            <div className="relative flex items-center gap-3 text-xs text-white/40">
              <ShieldCheck className="size-4 text-[#dff568]" />
              {language === "tr" ? "Hesap yok · Verileriniz cihazınızda" : "No account · Data stays on your device"}
            </div>
          </aside>

          <main className="flex min-h-full flex-col bg-[#fbfaf7]">
            <div className="flex items-center justify-between border-b border-black/8 px-5 py-5 sm:px-9 lg:px-12">
              <QuoteLogo className="h-6 w-auto lg:hidden" />
              <p lang="en" className="hidden text-xs font-semibold uppercase tracking-[0.17em] text-black/38 lg:block">
                {language === "tr" ? "Başlangıç ayarları" : "Workspace setup"}
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-black/35">0{onboardingStep} / 03</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((step) => <span key={step} className={cn("h-1.5 rounded-full transition-all duration-300", onboardingStep === step ? "w-8 bg-[#171815]" : "w-2 bg-black/12")} />)}
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-9 lg:px-12 lg:py-12">
              <AnimatePresence mode="wait">
                {onboardingStep === 1 ? (
                  <motion.div key="preferences" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28 }} className="w-full max-w-2xl">
                    <p lang="en" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728600]">01 · {language === "tr" ? "Tercihler" : "Preferences"}</p>
                    <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.04em] !text-[#171815] sm:text-5xl">{t.onboardingStep1Title}</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-black/48 sm:text-base">{t.onboardingStep1Desc}</p>

                    <div className="mt-9 space-y-8">
                      <fieldset>
                        <legend lang="en" className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42"><Globe className="size-3.5" />{t.languageLabel}</legend>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ code: "tr" as const, flag: "🇹🇷", label: "Türkçe" }, { code: "en" as const, flag: "🇬🇧", label: "English" }].map((option) => {
                            const selected = language === option.code;
                            return <button key={option.code} type="button" onClick={() => setLanguage(option.code)} className={cn("group flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition-all sm:px-5 cursor-pointer", selected ? "border-[#171815] bg-white shadow-[0_7px_20px_rgba(20,21,18,0.07)] ring-1 ring-[#171815]" : "border-black/9 bg-white/45 text-black/48 hover:border-black/25 hover:bg-white")}><span className="text-xl">{option.flag}</span><span className="text-sm font-semibold sm:text-base">{option.label}</span><span className={cn("ml-auto flex size-6 items-center justify-center rounded-full transition-colors", selected ? "bg-[#dff568] text-black" : "border border-black/10 text-transparent")}><Check className="size-3.5" /></span></button>;
                          })}
                        </div>
                      </fieldset>

                      <fieldset>
                        <legend lang="en" className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42"><Coins className="size-3.5" />{t.currencyLabel}</legend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(Object.keys(CURRENCIES) as Currency[]).map((currCode) => {
                            const c = CURRENCIES[currCode]; const selected = currency === currCode;
                            return <button key={currCode} type="button" onClick={() => setCurrency(currCode)} className={cn("relative flex min-h-24 flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer", selected ? "border-[#171815] bg-[#171815] text-white shadow-[0_8px_24px_rgba(20,21,18,0.16)]" : "border-black/9 bg-white/45 text-black/48 hover:border-black/25 hover:bg-white")}><span className={cn("font-geist text-lg font-medium leading-none", selected && "text-[#dff568]")}>{c.symbol}</span><span className="text-xs font-semibold tracking-wider">{c.code}</span>{selected && <span className="absolute right-3 top-3 size-2 rounded-full bg-[#dff568]" />}</button>;
                          })}
                        </div>
                      </fieldset>
                    </div>

                    <button type="button" className="group mt-9 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#171815] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,21,18,0.16)] transition-all hover:-translate-y-0.5 hover:bg-black cursor-pointer" onClick={() => setOnboardingStep(2)}>
                      {t.continueButton}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ) : onboardingStep === 2 ? (
                  <motion.div key="layout-step" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28 }} className="w-full max-w-2xl">
                    <p lang="en" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728600]">02 · {language === "tr" ? "Hizmetler Düzeni" : "Services Layout"}</p>
                    <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.04em] !text-[#171815] sm:text-5xl">{t.onboardingStepLayoutTitle}</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-black/48 sm:text-base">{t.onboardingStepLayoutDesc}</p>

                    <div className="mt-8">
                      {renderLayoutOptionCards(servicesLayout, (layout) => setServicesLayout(layout))}
                    </div>

                    <div className="mt-9 flex gap-3">
                      <button type="button" onClick={() => setOnboardingStep(1)} className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black/12 bg-white transition-colors hover:bg-black/5 cursor-pointer" aria-label={t.backButton}>
                        <ArrowLeft className="size-4" />
                      </button>
                      <button type="button" onClick={() => { setOnboardingStep(3); setTimeout(() => document.getElementById("new-company-name")?.focus(), 50); }} className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-full bg-[#171815] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,21,18,0.16)] transition-all hover:-translate-y-0.5 hover:bg-black cursor-pointer">
                        {t.continueButton}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="profile" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28 }} className="w-full max-w-2xl">
                    <p lang="en" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728600]">03 · {language === "tr" ? "Profil" : "Profile"}</p>
                    <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.04em] !text-[#171815] sm:text-5xl">{t.onboardingStep2Title}</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-black/48 sm:text-base">{t.onboardingStep2Desc}</p>

                    <div className="mt-8 grid gap-5">
                      <div className="grid gap-2"><Label lang="en" htmlFor="new-company-name" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/48">{t.companyNameLabel}</Label><Input id="new-company-name" placeholder={t.companyNamePlaceholder} value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} autoFocus className="h-14 rounded-xl border-black/10 bg-white px-4 text-base shadow-none focus-visible:ring-[#171815]" /></div>
                      {renderProfileLogoUploader("onboarding-profile-logo")}
                      <div className="grid gap-2"><Label lang="en" htmlFor="new-contact-info" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/48">{language === "tr" ? "E-posta, telefon ve adres" : t.contactInfoLabel}</Label><textarea id="new-contact-info" placeholder={language === "tr" ? "E-posta: merhaba@sirket.com\nTelefon: +90 555 123 45 67\nAdres: istanbul, Türkiye" : "Email: hello@company.com\nPhone: +1 555 123 4567\nAddress: New York, USA"} value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} className="flex min-h-32 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none placeholder:whitespace-pre-line placeholder:text-black/28 focus:border-black/35 focus:ring-1 focus:ring-black/20" /></div>
                      {renderFooterPreview()}
                    </div>

                    <div className="mt-8 flex gap-3"><button type="button" onClick={() => setOnboardingStep(2)} className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black/12 bg-white transition-colors hover:bg-black/5 cursor-pointer" aria-label={t.backButton}><ArrowLeft className="size-4" /></button><button type="button" onClick={handleCreateProfile} className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-full bg-[#171815] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,21,18,0.16)] transition-all hover:-translate-y-0.5 hover:bg-black cursor-pointer">{t.getStartedButton}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#ebe9e3] relative font-plex">

      {/* Custom Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-100 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-[#fbfaf7] p-6 sm:p-7 rounded-3xl shadow-[0_28px_80px_rgba(20,21,18,0.25)] border border-white/60 w-full max-w-105 flex flex-col gap-6 font-plex relative">
            <button
              onClick={() => {
                setNewTaxName("");
                setNewTaxRate("");
                setShowTaxModal(false);
              }}
              className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-black/4 text-black/40 hover:bg-black/8 hover:text-black cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="pr-10">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#728600]">{language === "tr" ? "VERGI AYARI" : "TAX SETTING"}</p>
              <h3 className="mt-2 font-semibold text-2xl tracking-[-0.03em] text-primary">{t.customTaxModalTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-black/42">{language === "tr" ? "Tekliflerinizde tekrar kullanabileceğiniz özel bir vergi tanımlayın." : "Create a custom tax you can reuse in future quotes."}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-tax-name" className="text-[11px] font-semibold text-black/52">{t.customTaxNameLabel}</Label>
              <Input
                id="custom-tax-name"
                placeholder={t.customTaxNamePlaceholder}
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
                className="h-12 rounded-xl border-black/10 bg-white px-4 shadow-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-tax-rate" className="text-[11px] font-semibold text-black/52">{t.customTaxRateLabel}</Label>
              <Input
                id="custom-tax-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder={t.customTaxRatePlaceholder}
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(e.target.value)}
                className="h-12 rounded-xl border-black/10 bg-white px-4 shadow-none"
              />
            </div>

            <div className="flex justify-end gap-2 mt-1">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewTaxName("");
                  setNewTaxRate("");
                  setShowTaxModal(false);
                }}
                className="h-11 rounded-full px-5 text-black/55 hover:bg-black/5 cursor-pointer"
              >
                {t.cancelButton}
              </Button>
              <Button onClick={handleSaveCustomTax} className="h-11 rounded-full bg-[#171815] px-6 text-white hover:bg-black cursor-pointer">
                {t.addTaxButton}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Modal (Used when adding subsequent profiles) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-100 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-[#fbfaf7] p-6 sm:p-7 rounded-3xl shadow-[0_28px_80px_rgba(20,21,18,0.25)] border border-white/60 w-full max-w-120 max-h-[calc(100vh-2rem)] overflow-y-auto flex flex-col gap-5 font-plex relative">
            <button
              onClick={() => {
                setNewCompanyName("");
                setNewContactInfo("");
                setNewLogoBase64("");
                setEditingProfileId(null);
                setConfirmingProfileDelete(false);
                setShowProfileModal(false);
              }}
              className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-black/4 text-black/40 hover:bg-black/8 hover:text-black cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="pr-10">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#728600]">{editingProfileId ? (language === "tr" ? "PROFIL AYARLARI" : "PROFILE SETTINGS") : (language === "tr" ? "YENI PROFIL" : "NEW PROFILE")}</p>
              <h3 className="mt-2 font-semibold text-2xl tracking-[-0.03em] text-primary">{editingProfileId ? (language === "tr" ? "Profili düzenle" : "Edit profile") : t.newProfileTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-black/42">{language === "tr" ? "Bu bilgiler oluşturduğunuz belgelerin alt kısmında yer alır." : "These details appear at the bottom of your documents."}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modal-company-name" className="text-[11px] font-semibold text-black/52">{t.companyNameLabel}</Label>
              <Input
                id="modal-company-name"
                placeholder={t.companyNamePlaceholder}
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="h-12 rounded-xl border-black/10 bg-white px-4 shadow-none"
              />
            </div>
            {renderProfileLogoUploader("modal-profile-logo")}
            <div className="grid gap-2">
              <Label htmlFor="modal-contact-info" className="text-[11px] font-semibold text-black/52">{language === "tr" ? "E-posta, telefon ve adres" : t.contactInfoLabel}</Label>
              <textarea
                id="modal-contact-info"
                placeholder={language === "tr" ? "E-posta: merhaba@sirket.com\nTelefon: +90 555 123 45 67\nAdres: istanbul, Türkiye" : "Email: hello@company.com\nPhone: +1 555 123 4567\nAddress: New York, USA"}
                value={newContactInfo}
                onChange={(e) => setNewContactInfo(e.target.value)}
                className="flex min-h-28 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none placeholder:whitespace-pre-line placeholder:text-black/28 focus:border-black/30 focus:ring-1 focus:ring-black/15"
              />
            </div>

            {/* Live Preview */}
            {renderFooterPreview()}

            <div className="flex items-center justify-between gap-2 mt-1">
              <div>
                {editingProfileId && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!confirmingProfileDelete) {
                        setConfirmingProfileDelete(true);
                        return;
                      }
                      deleteProfile(editingProfileId);
                      setEditingProfileId(null);
                      setConfirmingProfileDelete(false);
                      setNewCompanyName("");
                      setNewContactInfo("");
                      setNewLogoBase64("");
                      setShowProfileModal(false);
                      toast.success(language === "tr" ? "Profil silindi" : "Profile deleted");
                    }}
                    className="h-11 rounded-full px-4 text-xs text-danger hover:bg-danger/8 hover:text-danger cursor-pointer"
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    {confirmingProfileDelete ? (language === "tr" ? "Silmek için tekrar tıkla" : "Click again to delete") : (language === "tr" ? "Profili sil" : "Delete profile")}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewCompanyName("");
                  setNewContactInfo("");
                  setNewLogoBase64("");
                  setEditingProfileId(null);
                  setConfirmingProfileDelete(false);
                  setShowProfileModal(false);
                }}
                className="h-11 rounded-full px-5 text-black/55 hover:bg-black/5 cursor-pointer"
              >
                {t.cancelButton}
              </Button>
              <Button onClick={handleCreateProfile} className="h-11 rounded-full bg-[#171815] px-7 text-white hover:bg-black cursor-pointer">{t.saveButton}</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Services Layout Modal for Returning Users */}
      {!forceProfileCreation && !hasChosenServicesLayout && (
        <div className="fixed inset-0 z-100 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-[#fbfaf7] p-6 sm:p-8 rounded-3xl shadow-[0_28px_80px_rgba(20,21,18,0.25)] border border-white/60 w-full max-w-2xl flex flex-col gap-6 font-plex relative"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dff568]/40 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-[#728600]">
                <Sparkles className="size-3" />
                {t.layoutModalTag}
              </div>
              <h3 className="mt-3 font-semibold text-2xl sm:text-3xl tracking-[-0.03em] text-primary">
                {t.layoutModalTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/50">
                {t.layoutModalDesc}
              </p>
            </div>

            {renderLayoutOptionCards(servicesLayout, (layout) => setServicesLayout(layout))}

            <div className="flex justify-end pt-1">
              <Button
                onClick={() => {
                  setServicesLayout(servicesLayout);
                  toast.success(t.layoutUpdated);
                }}
                className="h-12 rounded-full bg-[#171815] px-7 text-sm font-semibold text-white hover:bg-black cursor-pointer shadow-[0_8px_20px_rgba(20,21,18,0.18)]"
              >
                {t.saveLayoutButton}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      {activeProfile && (
        <>
          <h1 className="sr-only">Quote – Minimal & Fast Invoice Generator</h1>
          {/* Left Panel */}
          <div className="relative z-10 flex h-full w-full shrink-0 flex-col border-r border-black/8 bg-[#fbfaf7] shadow-[12px_0_40px_rgba(20,21,18,0.04)] lg:w-108 xl:w-116">
            <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-6 md:px-7 lg:px-6">

              {/* Profile Switcher & Logo */}
              <section className="flex flex-col gap-4 border-b border-black/8 pb-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <QuoteLogo className="h-6 w-auto" />
                    <p className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-black/35">{language === "tr" ? "YENI TEKLIF" : "NEW QUOTE"}</p>
                  </div>

                  {/* Services Layout Switcher */}
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <div className="flex items-center rounded-full border border-black/10 bg-white p-0.5 shadow-none">
                      <button
                        type="button"
                        title={t.layoutInlineTitle}
                        onClick={() => {
                          if (servicesLayout !== "inline") {
                            setServicesLayout("inline");
                            toast.success(t.layoutUpdated);
                          }
                        }}
                        className={cn(
                          "flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-all cursor-pointer",
                          servicesLayout === "inline"
                            ? "bg-[#171815] text-white shadow-xs"
                            : "text-black/45 hover:text-black"
                        )}
                      >
                        <LayoutList className="size-3.5" />
                        <span className="hidden sm:inline">{t.layoutInlineShort}</span>
                      </button>
                      <button
                        type="button"
                        title={t.layoutTabsTitle}
                        onClick={() => {
                          if (servicesLayout !== "tabs") {
                            setServicesLayout("tabs");
                            toast.success(t.layoutUpdated);
                          }
                        }}
                        className={cn(
                          "flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-all cursor-pointer",
                          servicesLayout === "tabs"
                            ? "bg-[#171815] text-white shadow-xs"
                            : "text-black/45 hover:text-black"
                        )}
                      >
                        <Columns2 className="size-3.5" />
                        <span className="hidden sm:inline">{t.layoutTabsShort}</span>
                      </button>
                    </div>

                  </div>
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <Select value={activeProfileId} onValueChange={setActiveProfileId}>
                    <SelectTrigger className="flex-1 h-11 rounded-xl border-black/10 bg-white shadow-none">
                      <SelectValue placeholder={t.selectProfilePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.companyName || p.profileName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => { setEditingProfileId(null); setConfirmingProfileDelete(false); setNewCompanyName(""); setNewContactInfo(""); setNewLogoBase64(""); setShowProfileModal(true); }} className="h-11 rounded-xl border-black/10 bg-white px-4 cursor-pointer">
                    <Plus className="size-4" /><span className="sr-only sm:not-sr-only sm:ml-1">{t.addNewProfile}</span>
                  </Button>
                  <Button variant="outline" size="icon" aria-label={language === "tr" ? "Profili düzenle" : "Edit profile"} onClick={() => { setEditingProfileId(activeProfile.id); setConfirmingProfileDelete(false); setNewCompanyName(activeProfile.companyName); setNewContactInfo(activeProfile.contactInfo); setNewLogoBase64(activeProfile.logoBase64 || ""); setShowProfileModal(true); }} className="size-11 rounded-xl border-black/10 bg-white text-black/45 cursor-pointer hover:text-black">
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              </section>

              {/* Tab Navigation if servicesLayout === "tabs" */}
              {servicesLayout === "tabs" && (
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-black/8 bg-black/[0.03] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer",
                      activeTab === "details"
                        ? "bg-white text-primary shadow-[0_4px_12px_rgba(20,21,18,0.06)] ring-1 ring-black/5"
                        : "text-black/50 hover:text-black"
                    )}
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#dff568] text-[9px] font-bold text-black">
                      01
                    </span>
                    {t.invoiceDetailsTitle}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("services")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer",
                      activeTab === "services"
                        ? "bg-white text-primary shadow-[0_4px_12px_rgba(20,21,18,0.06)] ring-1 ring-black/5"
                        : "text-black/50 hover:text-black"
                    )}
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#dff568] text-[9px] font-bold text-black">
                      02
                    </span>
                    {t.servicesTitle}
                    <span className="ml-0.5 rounded-full bg-black/8 px-1.5 py-0.5 text-[10px] font-mono text-black/60">
                      {lineItems.length}/7
                    </span>
                  </button>
                </div>
              )}

              {/* Invoice Details Section */}
              {(servicesLayout === "inline" || activeTab === "details") && (
                <section className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#dff568] font-mono text-[10px] font-bold">
                      01
                    </span>
                    <h2 className="text-xl font-semibold tracking-[-0.025em]">{t.invoiceDetailsTitle}</h2>
                  </div>
                  <div className="grid gap-4">
                    {/* Document Title Input & Presets */}
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="docTitle" className="text-xs font-semibold text-black/70">
                          {t.documentTitleLabel}
                        </Label>
                        {invoiceData.title && (
                          <button
                            type="button"
                            onClick={() => setInvoiceData({ ...invoiceData, title: "" })}
                            className="text-[10px] text-black/40 hover:text-black hover:underline cursor-pointer"
                          >
                            {language === "tr" ? "Varsayılana Dön" : "Reset Default"}
                          </button>
                        )}
                      </div>
                      <Input
                        id="docTitle"
                        value={invoiceData.title ?? ""}
                        onChange={(e) => setInvoiceData({ ...invoiceData, title: e.target.value })}
                        placeholder={
                          invoiceData.billingType === "subscription"
                            ? t.subscriptionDocumentTitle
                            : t.documentTitle
                        }
                        className="h-11 rounded-xl border-black/10 bg-white px-4 text-xs font-semibold uppercase tracking-wider shadow-none placeholder:text-black/30 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                      />
                      {/* Preset Suggestions */}
                      <div className="rounded-xl border border-dashed border-black/10 bg-black/[0.018] p-2.5">
                        <div className="mb-2 flex items-center px-0.5">
                          <span className="flex items-center gap-1.5 text-[9.5px] font-semibold text-black/52">
                            <Sparkles className="size-3 text-[#7f9500]" />
                            {t.titleSuggestionsLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1" role="group" aria-label={t.titleSuggestionsLabel}>
                          {[
                            { label: t.presetTitleServiceSummary, value: language === "tr" ? "HİZMET ÖZETİ" : "SERVICE SUMMARY" },
                            { label: t.presetTitleQuote, value: language === "tr" ? "FİYAT TEKLİFİ" : "PRICE QUOTE" },
                            { label: t.presetTitleProforma, value: language === "tr" ? "PROFORMA FATURA" : "PROFORMA INVOICE" },
                            { label: t.presetTitleProposal, value: language === "tr" ? "PROJE TEKLİFİ" : "PROJECT PROPOSAL" },
                          ].map((preset) => {
                            const isSelected = invoiceData.title === preset.value;
                            return (
                              <button
                                key={preset.value}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => {
                                  setInvoiceData({ ...invoiceData, title: preset.value });
                                  toast.success(`${preset.label} ${language === "tr" ? "başlığı seçildi" : "title selected"}`);
                                }}
                                className={cn(
                                  "min-w-0 whitespace-nowrap rounded-lg border px-1.5 py-1.5 text-[9px] font-medium transition-all cursor-pointer xl:text-[9.5px]",
                                  isSelected
                                    ? "border-black bg-[#171815] text-white shadow-2xs"
                                    : "border-black/8 bg-white text-black/58 hover:border-black/20 hover:bg-black/[0.035] hover:text-black"
                                )}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="clientName">{t.clientNameLabel}</Label>
                      <Input
                        id="clientName"
                        value={invoiceData.clientName}
                        onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                        placeholder={t.clientNamePlaceholder}
                        className="h-12 rounded-xl border-black/10 bg-white px-4 shadow-none"
                        onFocus={() => {
                          if (
                            invoiceData.clientName === "Ahmet Yılmaz" ||
                            invoiceData.clientName === "John Doe" ||
                            invoiceData.clientName === "Müşteri Adı" ||
                            invoiceData.clientName === "Client Name"
                          ) {
                            setInvoiceData({ ...invoiceData, clientName: "" });
                          }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>{t.dateLabel}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-12 rounded-xl border-black/10 bg-white justify-start text-left font-normal cursor-pointer shadow-none",
                                !invoiceData.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {invoiceData.date ? invoiceData.date : <span>{t.selectDatePlaceholder}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={parseTrDate(invoiceData.date)}
                              onSelect={(date) => {
                                if (date) {
                                  setInvoiceData({ ...invoiceData, date: format(date, "dd.MM.yyyy") })
                                }
                              }}
                              initialFocus
                              locale={language === "en" ? enUS : tr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t.kdvLabel}</Label>
                        <Select
                          value={invoiceData.taxId || allTaxes.find((tax) => tax.rate === invoiceData.kdvRate)?.id || "tax-0"}
                          onValueChange={(val) => {
                            if (val === "add-custom-tax") {
                              setShowTaxModal(true);
                            } else {
                              const selected = allTaxes.find((tax) => tax.id === val);
                              if (selected) {
                                const isDefaultTax = selected.id.startsWith("tax-");
                                setInvoiceData({
                                  ...invoiceData,
                                  kdvRate: selected.rate,
                                  taxName: isDefaultTax ? t.kdvTaxLabel : selected.name,
                                  taxId: selected.id,
                                });
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-black/10 bg-white cursor-pointer shadow-none">
                            <SelectValue placeholder={t.kdvLabel} />
                          </SelectTrigger>
                          <SelectContent>
                            {allTaxes.map((tax) => {
                              const isDefaultTax = tax.id.startsWith("tax-");
                              const displayName = isDefaultTax ? t.kdvTaxLabel : tax.name;
                              return (
                                <SelectItem key={tax.id} value={tax.id}>
                                  {tax.rate === 0
                                    ? t.kdvNone
                                    : `${displayName} (%${tax.rate})`}
                                </SelectItem>
                              );
                            })}
                            <SelectItem value="add-custom-tax" className="mt-1 pt-3 font-semibold text-[#667800] cursor-pointer before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-black/8 data-[state=checked]:bg-transparent">
                              {t.addCustomTaxOption}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Button to proceed to Services Tab in tabbed mode */}
                    {servicesLayout === "tabs" && (
                      <Button
                        type="button"
                        onClick={() => setActiveTab("services")}
                        className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171815] text-xs font-semibold text-white shadow-none transition-all hover:bg-black cursor-pointer"
                      >
                        {t.nextToServices}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    )}
                  </div>
                </section>
              )}

              {/* Line Items Section */}
              {(servicesLayout === "inline" || activeTab === "services") && (
                <section className="flex flex-col gap-4">
                  {servicesLayout === "tabs" && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("details")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-black/45 transition-colors hover:text-black cursor-pointer w-fit mb-1"
                    >
                      <ArrowLeft className="size-3.5" />
                      {t.backToDetails}
                    </button>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-[#dff568] font-mono text-[10px] font-bold">
                        02
                      </span>
                      <h2 className="text-xl font-semibold tracking-[-0.025em]">{t.servicesTitle}</h2>
                    </div>
                    <span className="text-[11px] text-black/35">{lineItems.length} / 7</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {lineItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative flex flex-col gap-2 rounded-xl border border-black/8 bg-white p-3 shadow-[0_3px_12px_rgba(20,21,18,0.03)]"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_6.5rem_2rem] items-center gap-2">
                            <Input
                              id={`service-name-${item.id}`}
                              aria-label={`${language === "tr" ? "Hizmet" : "Service"} ${index + 1}`}
                              placeholder={t.serviceNamePlaceholder}
                              value={item.name}
                              maxLength={65}
                              onChange={(e) => updateLineItem(item.id, { name: e.target.value })}
                              className="h-10 rounded-lg border-black/8 bg-[#fbfaf7] px-3 text-sm font-medium shadow-none"
                            />
                            <Input type="number" min="1" aria-label={t.thQuantity} placeholder={t.quantityPlaceholder} value={item.quantity} onChange={(e) => updateLineItem(item.id, { quantity: e.target.value === "" ? "" : Number(e.target.value) })} className="h-10 rounded-lg border-black/8 bg-[#fbfaf7] px-2 text-center shadow-none" />
                            <Input type="number" min="0" step="0.01" aria-label={`${t.thPrice} · ${currency}`} placeholder={`${CURRENCIES[currency].symbol} ${t.pricePlaceholder}`} value={item.price} onChange={(e) => updateLineItem(item.id, { price: e.target.value === "" ? "" : Number(e.target.value) })} className="h-10 rounded-lg border-black/8 bg-[#fbfaf7] px-2 shadow-none" />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={language === "tr" ? "Hizmeti sil" : "Delete service"}
                              className="size-8 rounded-full text-black/28 hover:text-danger hover:bg-danger/10 cursor-pointer"
                              onClick={() => {
                                removeLineItem(item.id);
                                setExpandedDescriptions((current) => current.filter((id) => id !== item.id));
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                          {expandedDescriptions.includes(item.id) || item.description ? (
                            <textarea
                              aria-label={t.serviceDescriptionPlaceholder}
                              placeholder={t.serviceDescriptionPlaceholder}
                              value={item.description || ""}
                              maxLength={120}
                              onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                              rows={1}
                              autoFocus={!item.description}
                              className="min-h-9 w-full resize-none rounded-lg border border-black/8 bg-[#fbfaf7] px-3 py-2 text-xs leading-5 text-black/55 outline-none placeholder:text-black/28 focus:border-black/25 focus:ring-1 focus:ring-black/10"
                            />
                          ) : (
                            <button type="button" onClick={() => setExpandedDescriptions((current) => [...current, item.id])} className="w-fit px-1 text-[11px] font-medium text-black/35 transition-colors hover:text-black/65">
                              + {t.serviceDescriptionPlaceholder}
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <Button
                      variant="dashed"
                      className="mt-2 h-12 w-full rounded-xl border-black/12 bg-transparent text-sm cursor-pointer hover:border-black/30 hover:bg-white"
                      onClick={() => {
                        addLineItem();
                        setTimeout(() => {
                          const inputs = document.querySelectorAll<HTMLInputElement>('input[id^="service-name-"]');
                          if (inputs.length > 0) {
                            inputs[inputs.length - 1].focus();
                          }
                        }, 50);
                      }}
                      disabled={lineItems.length >= 7}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {lineItems.length >= 7 ? t.maxLimitReached : t.addServiceButton}
                    </Button>
                  </div>
                </section>
              )}

            </div>
            {/* Action Buttons */}
            <div className="shrink-0 p-5 md:px-8 md:py-5 border-t border-black/8 bg-[#fbfaf7]/95 backdrop-blur">
              <Button onClick={handleDownloadPDF} className="w-full h-14 rounded-full bg-[#171815] text-sm font-semibold shadow-[0_10px_24px_rgba(20,21,18,0.16)] cursor-pointer hover:bg-black">
                <Download className="w-5 h-5 mr-2" />
                {t.downloadPdfButton}<span className="ml-1 text-[10px] font-normal text-white/45">· A4</span>
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="preview-workspace relative flex h-full flex-1 flex-col overflow-y-auto bg-[#e8e6df]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(223,245,104,0.22),transparent_68%)]" />

            <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between gap-4 border-b border-black/7 bg-[#ebe9e3]/86 px-5 py-4 backdrop-blur-xl sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-black/8 bg-white/80 shadow-[0_5px_16px_rgba(20,21,18,0.06)]">
                  <FileText className="size-4 text-black/65" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/38">
                      {language === "tr" ? "Canlı önizleme" : "Live preview"}
                    </p>
                    <span className="size-1.5 rounded-full bg-[#8ba000] shadow-[0_0_0_3px_rgba(139,160,0,0.12)]" />
                  </div>
                  <p className="mt-0.5 truncate font-geist text-sm font-semibold text-[#171815]">
                    {invoiceData.clientName || (language === "tr" ? "Yeni teklif" : "New quote")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex h-9 items-center rounded-full border border-black/8 bg-white/75 p-0.5 shadow-[0_4px_14px_rgba(20,21,18,0.04)]" role="group" aria-label={language === "tr" ? "Önizleme yakınlaştırma" : "Preview zoom"}>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((zoom) => Math.max(60, zoom - 10))}
                    disabled={previewZoom === 60}
                    className="flex size-7 items-center justify-center rounded-full text-black/55 transition-colors hover:bg-black/6 hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={language === "tr" ? "Uzaklaştır" : "Zoom out"}
                    title={language === "tr" ? "Uzaklaştır" : "Zoom out"}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(100)}
                    className="min-w-11 px-1 font-mono text-[9px] font-semibold tabular-nums text-black/58 transition-colors hover:text-black"
                    aria-label={language === "tr" ? "Yakınlaştırmayı yüzde 100'e sıfırla" : "Reset zoom to 100 percent"}
                    title={language === "tr" ? "Sıfırla" : "Reset"}
                  >
                    {previewZoom}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((zoom) => Math.min(100, zoom + 10))}
                    disabled={previewZoom === 100}
                    className="flex size-7 items-center justify-center rounded-full text-black/55 transition-colors hover:bg-black/6 hover:text-black disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={language === "tr" ? "Yakınlaştır" : "Zoom in"}
                    title={language === "tr" ? "Yakınlaştır" : "Zoom in"}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <span className="hidden rounded-full border border-black/8 bg-white/55 px-3 py-1.5 font-mono text-[9px] font-semibold tracking-wide text-black/45 sm:inline-flex">
                  A4 · PDF
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/75 px-3 py-1.5 text-[9px] font-semibold text-black/52 shadow-[0_4px_14px_rgba(20,21,18,0.04)]">
                  <Check className="size-3 text-[#718400]" />
                  {language === "tr" ? "Kaydedildi" : "Saved"}
                </span>
              </div>
            </header>

            {/* Container for A4 Paper + Right Vertical Dock */}
            <div className="relative z-10 mx-auto grid w-full max-w-288 items-start gap-5 px-3 pb-14 pt-5 sm:px-6 sm:pt-7 2xl:grid-cols-[minmax(0,1fr)_15rem] 2xl:px-7">
              <div className="relative w-full overflow-auto rounded-[1.75rem] border border-white/65 bg-white/22 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:p-4">
                <span className="pointer-events-none absolute left-5 top-5 z-10 hidden rounded-full border border-black/7 bg-[#171815]/88 px-2.5 py-1 font-mono text-[8px] font-semibold tracking-[0.12em] text-white/70 shadow-lg sm:inline-flex">
                  01 / 01
                </span>
                <div
                  className="relative mx-auto shrink-0 transition-[width,max-width] duration-200 ease-out"
                  style={{
                    width: `${previewZoom}%`,
                    maxWidth: `${49.625 * (previewZoom / 100)}rem`,
                    aspectRatio: "1/1.414",
                  }}
                >
                  <div
                    className="pdf-preview-transform absolute left-0 top-0 origin-top-left transition-transform duration-200 ease-out"
                    style={{
                      width: `${100 / (previewZoom / 100)}%`,
                      transform: `scale(${previewZoom / 100})`,
                    }}
                  >
                    {/* A4 Paper */}
                    <div
                      ref={printRef}
                      className={cn(
                        "pdf-container flex w-full flex-col justify-start overflow-hidden bg-white p-16 shadow-[0_28px_80px_-20px_rgba(20,21,18,0.28),0_2px_8px_rgba(20,21,18,0.08)] transition-all",
                        getPdfFontClass(invoiceData.pdfFont)
                      )}
                      style={{ aspectRatio: "1/1.414" }}
                    >
                {/* Centered Title */}
                <div className="text-center mb-10 mt-6">
                  <h1 lang="en" className="text-2xl font-bold uppercase tracking-widest text-primary mb-2">
                    {invoiceData.title?.trim() || (invoiceData.billingType === "subscription" ? t.subscriptionDocumentTitle : t.documentTitle)}
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-mono">
                    <span>{invoiceData.date}</span>
                    {invoiceData.billingType === "subscription" && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-primary">
                          {invoiceData.billingCycle === "monthly"
                            ? t.cycleMonthlyBadge
                            : invoiceData.billingCycle === "quarterly"
                            ? t.cycleQuarterlyBadge
                            : t.cycleYearlyBadge}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Due Date or Validity badge */}
                  {invoiceData.showDueDate && invoiceData.dueDate && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f5f3ee] px-3 py-1 text-[11px] text-black/70 font-medium">
                      <CalendarClock className="size-3 text-black/50" />
                      <span>{t.dueDatePrefix}: {invoiceData.dueDate}</span>
                    </div>
                  )}
                  {invoiceData.billingType === "subscription" && (invoiceData.periodStart || invoiceData.periodEnd) && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f5f3ee] px-4 py-1.5 text-xs text-primary font-medium">
                      <span className="size-1.5 rounded-full bg-[#8ba000]" />
                      <span>
                        {t.billingPeriodLabel}: {invoiceData.periodStart || invoiceData.date} – {invoiceData.periodEnd || getFutureDate(12)}
                      </span>
                      {invoiceData.autoRenewal && (
                        <span className="rounded-full bg-black/6 px-2 py-0.5 text-[10px] font-semibold text-black/60">
                          {t.autoRenewalLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Info */}
                <div className="mb-14 text-center">
                  <h3 lang="en" className="text-sm font-bold uppercase text-muted-foreground mb-2">{t.clientHeader}</h3>
                  <p className="text-2xl font-medium">{invoiceData.clientName}</p>
                </div>

                {/* Table */}
                <div className="flex-1">
                  <table className="w-full text-sm mt-2">
                    <thead>
                      <tr lang="en" className="border-b-2 border-primary text-primary font-bold uppercase">
                        <th className="py-3 text-left w-1/2 font-bold">{t.thService}</th>
                        <th className="py-3 text-center w-1/6 font-bold">{t.thQuantity}</th>
                        <th className="py-3 text-right w-1/6 font-bold">{t.thPrice}</th>
                        <th className="py-3 text-right w-1/6 font-bold">{t.thTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            {t.noServicesAdded}
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item) => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-4 wrap-break-word pr-3 align-middle" title={item.name || t.unnamedService}>
                              <span className="font-medium">{item.name || t.unnamedService}</span>
                              {item.description && <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{item.description}</span>}
                            </td>
                            <td className="py-4 text-center font-mono align-middle">{item.quantity}</td>
                            <td className="py-4 text-right font-geist tabular-nums align-middle">{formatCurrency(Number(item.price) || 0, currency)}</td>
                            <td className="py-4 text-right font-geist tabular-nums font-bold text-primary align-middle">
                              {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Totals Calculation Box */}
                  <div className="flex justify-end mt-8">
                    <div className="w-1/2 flex flex-col gap-1.5">
                      {(invoiceData.kdvRate > 0 || (invoiceData.showDiscount && discountRate > 0)) && (
                        <div className="flex justify-between py-1.5 text-muted-foreground text-sm">
                          <span className="font-medium">{t.subtotalLabel}</span>
                          <span className="font-geist tabular-nums">{formatCurrency(subtotal, currency)}</span>
                        </div>
                      )}
                      {invoiceData.showDiscount && discountRate > 0 && (
                        <div className="flex justify-between py-1.5 text-red-600 text-sm">
                          <span className="font-medium">{t.discountBadgeLabel} (%{discountRate})</span>
                          <span className="font-geist tabular-nums font-medium">-{formatCurrency(discountAmount, currency)}</span>
                        </div>
                      )}
                      {invoiceData.kdvRate > 0 && (
                        <div className="flex justify-between py-1.5 text-muted-foreground text-sm">
                          <span className="font-medium">
                            {(!invoiceData.taxId || invoiceData.taxId.startsWith("tax-") || invoiceData.taxName === "KDV" || invoiceData.taxName === "VAT" || invoiceData.taxName === "VAT / Tax")
                              ? t.kdvTaxLabel
                              : invoiceData.taxName} (%{invoiceData.kdvRate})
                          </span>
                          <span className="font-geist tabular-nums">{formatCurrency(kdvAmount, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline py-3 border-t-2 border-primary">
                        <span className="font-bold text-lg uppercase tracking-tight">{t.totalLabel}</span>
                        <div className="text-right">
                          <span className="font-geist tabular-nums font-bold text-2xl text-primary">
                            {formatCurrency(total, currency)}
                          </span>
                          {invoiceData.billingType === "subscription" && (
                            <span className="ml-1.5 font-geist font-semibold text-sm text-muted-foreground">
                              {invoiceData.billingCycle === "monthly"
                                ? t.perMonth
                                : invoiceData.billingCycle === "quarterly"
                                ? t.perQuarter
                                : t.perYear}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank & Payment Information Card on PDF */}
                  {invoiceData.showPaymentInfo && (invoiceData.bankName || invoiceData.iban || invoiceData.accountHolder) && (
                    <div className="mt-6 rounded-xl border border-black/8 bg-[#fbfaf7] p-3.5 text-xs">
                      <p className="font-semibold text-primary text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Building2 className="size-3 text-black/60" />
                        {t.paymentInfoTitle}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-black/75">
                        {invoiceData.bankName && (
                          <div><span className="font-medium text-black/45">{t.bankNameLabel}: </span><span className="font-medium">{invoiceData.bankName}</span></div>
                        )}
                        {invoiceData.accountHolder && (
                          <div><span className="font-medium text-black/45">{t.accountHolderLabel}: </span><span className="font-medium">{invoiceData.accountHolder}</span></div>
                        )}
                        {invoiceData.iban && (
                          <div className="col-span-full font-mono text-[11px]"><span className="font-medium text-black/45 font-sans">{t.ibanLabel}: </span><span className="font-semibold">{invoiceData.iban}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes & Terms on PDF */}
                  {invoiceData.showNotes !== false && invoiceData.notes && (
                    <div className="mt-4 rounded-xl border border-black/6 bg-[#fbfaf7] p-4 text-xs text-muted-foreground">
                      <p className="font-semibold text-primary text-[10px] uppercase tracking-wider mb-1">
                        {language === "tr" ? "Notlar ve Şartlar" : "Notes & Terms"}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed text-black/70">{invoiceData.notes}</p>
                    </div>
                  )}

                  {/* Signature & Stamp Area on PDF */}
                  {invoiceData.showSignature && (
                    <div className="mt-8 flex justify-end">
                      <div className="w-56 text-center border-t border-black/40 pt-2">
                        <p className="text-xs font-semibold text-primary">
                          {invoiceData.signatureTitle || t.signatureLineText}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{invoiceData.date}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer (Logo & Freelancer Info) */}
                <div className="mt-auto pt-12 flex flex-col items-center text-center gap-4">
                  {activeProfile.logoBase64 && (
                    <Image src={activeProfile.logoBase64} alt="Company Logo" width={200} height={64} className="h-16 w-auto object-contain max-w-50" />
                  )}
                  <div className="flex flex-col">
                    <p className="font-bold text-lg">{activeProfile.companyName}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{activeProfile.contactInfo}</p>
                  </div>
                </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Vertical Modular Dock */}
              <aside className="sticky top-24 z-30 flex w-full shrink-0 flex-col gap-3 rounded-[1.5rem] border border-black/8 bg-[#fbfaf7]/94 p-3 shadow-[0_18px_45px_rgba(20,21,18,0.1)] backdrop-blur-xl transition-all">
                {/* Section 1: Document Type */}
                <div className="flex flex-col gap-1.5 px-0.5">
                  <span className="px-1.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/35">
                    {language === "tr" ? "Belge Tipi" : "Quote Type"}
                  </span>
                  <div className="flex gap-1 rounded-xl border border-black/6 bg-black/[0.035] p-1 2xl:flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceData({ ...invoiceData, billingType: "one-time" });
                        toast.success(language === "tr" ? "Tek Seferlik mod seçildi" : "One-Time selected");
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all cursor-pointer",
                        (!invoiceData.billingType || invoiceData.billingType === "one-time")
                          ? "bg-white text-black shadow-xs ring-1 ring-black/5"
                          : "text-black/50 hover:text-black hover:bg-white/50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="size-3 text-[#789000]" />
                        {t.billingOneTime}
                      </span>
                      {(!invoiceData.billingType || invoiceData.billingType === "one-time") && (
                        <span className="size-1.5 rounded-full bg-[#8ba000]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceData({
                          ...invoiceData,
                          billingType: "subscription",
                          billingCycle: invoiceData.billingCycle || "yearly",
                          periodStart: invoiceData.periodStart || invoiceData.date,
                          periodEnd: invoiceData.periodEnd || getFutureDate(12),
                        });
                        toast.success(language === "tr" ? "Abonelik modu seçildi" : "Subscription selected");
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all cursor-pointer",
                        invoiceData.billingType === "subscription"
                          ? "bg-[#171815] text-white shadow-xs"
                          : "text-black/50 hover:text-black hover:bg-white/50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="size-3 text-[#dff568]" />
                        {t.billingSubscription}
                      </span>
                      {invoiceData.billingType === "subscription" && (
                        <span className="size-1.5 rounded-full bg-[#dff568]" />
                      )}
                    </button>
                  </div>

                  {/* Subscription Settings Block (Frequency & Dates) */}
                  {invoiceData.billingType === "subscription" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-1 flex flex-col gap-2.5 rounded-2xl border border-black/8 bg-white p-3 text-[10px] shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-black/45">
                          {t.billingCycleLabel}
                        </span>
                      </div>

                      {/* Frequency Selector: 1 Yıl / 1 Ay / 3 Ay */}
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "yearly" as const, label: t.cycleYearly, months: 12 },
                          { id: "monthly" as const, label: t.cycleMonthly, months: 1 },
                          { id: "quarterly" as const, label: t.cycleQuarterly, months: 3 },
                        ].map((cycle) => {
                          const selected = (invoiceData.billingCycle || "yearly") === cycle.id;
                          return (
                            <button
                              key={cycle.id}
                              type="button"
                              onClick={() => {
                                let newPeriodEnd = invoiceData.periodEnd;
                                if (invoiceData.periodStart) {
                                  const startDate = parseTrDate(invoiceData.periodStart);
                                  const endDate = new Date(startDate);
                                  endDate.setMonth(endDate.getMonth() + cycle.months);
                                  newPeriodEnd = format(endDate, "dd.MM.yyyy");
                                }
                                setInvoiceData({
                                  ...invoiceData,
                                  billingCycle: cycle.id,
                                  periodEnd: newPeriodEnd,
                                });
                              }}
                              className={cn(
                                "h-8 rounded-lg text-center text-[9.5px] font-semibold transition-all cursor-pointer",
                                selected
                                  ? "bg-[#171815] text-white shadow-2xs"
                                  : "bg-black/[0.04] text-black/55 hover:bg-black/[0.08]"
                              )}
                            >
                              {cycle.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Start & End Dates */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="block text-[8px] text-black/40 mb-0.5">{t.periodStartLabel}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="h-8 w-full truncate rounded-lg border border-black/8 bg-[#fbfaf7] px-2 text-left font-mono text-[9px] text-black/75 cursor-pointer hover:border-black/20"
                              >
                                {invoiceData.periodStart || invoiceData.date}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="left" align="center" collisionPadding={16} className="w-auto p-4" sideOffset={12}>
                              <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-3">
                                <div>
                                  <p className="text-[12px] font-bold text-black/85">{t.periodStartLabel}</p>
                                  <p className="mt-1 text-[9px] text-black/40">{language === "tr" ? "Dönemin başlayacağı tarihi seçin." : "Choose when the period begins."}</p>
                                </div>
                                <DockPopoverCloseButton language={language} />
                              </div>
                              <div className="mt-3 rounded-xl border border-black/8 bg-white p-1">
                                <Calendar
                                  mode="single"
                                  selected={parseTrDate(invoiceData.periodStart || invoiceData.date)}
                                  onSelect={(date) => {
                                    if (date) {
                                      const startStr = format(date, "dd.MM.yyyy");
                                      const endDate = new Date(date);
                                      const months = invoiceData.billingCycle === "monthly" ? 1 : invoiceData.billingCycle === "quarterly" ? 3 : 12;
                                      endDate.setMonth(endDate.getMonth() + months);
                                      setInvoiceData({
                                        ...invoiceData,
                                        periodStart: startStr,
                                        periodEnd: format(endDate, "dd.MM.yyyy"),
                                      });
                                    }
                                  }}
                                  initialFocus
                                  locale={language === "en" ? enUS : tr}
                                />
                              </div>
                              <DockPopoverFooter language={language} />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <span className="block text-[8px] text-black/40 mb-0.5">{t.periodEndLabel}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="h-8 w-full truncate rounded-lg border border-black/8 bg-[#fbfaf7] px-2 text-left font-mono text-[9px] text-black/75 cursor-pointer hover:border-black/20"
                              >
                                {invoiceData.periodEnd || getFutureDate(12)}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="left" align="center" collisionPadding={16} className="w-auto p-4" sideOffset={12}>
                              <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-3">
                                <div>
                                  <p className="text-[12px] font-bold text-black/85">{t.periodEndLabel}</p>
                                  <p className="mt-1 text-[9px] text-black/40">{language === "tr" ? "Dönemin biteceği tarihi seçin." : "Choose when the period ends."}</p>
                                </div>
                                <DockPopoverCloseButton language={language} />
                              </div>
                              <div className="mt-3 rounded-xl border border-black/8 bg-white p-1">
                                <Calendar
                                  mode="single"
                                  selected={parseTrDate(invoiceData.periodEnd || getFutureDate(12))}
                                  onSelect={(date) => {
                                    if (date) {
                                      setInvoiceData({ ...invoiceData, periodEnd: format(date, "dd.MM.yyyy") });
                                    }
                                  }}
                                  initialFocus
                                  locale={language === "en" ? enUS : tr}
                                />
                              </div>
                              <DockPopoverFooter language={language} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Auto-renewal Checkbox */}
                      <label className="flex items-center gap-1.5 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={invoiceData.autoRenewal ?? true}
                          onChange={(e) => setInvoiceData({ ...invoiceData, autoRenewal: e.target.checked })}
                          className="size-3 rounded border-black/20 text-[#171815] accent-[#171815] cursor-pointer"
                        />
                        <span className="text-[9px] font-medium text-black/60">{t.autoRenewalLabel}</span>
                      </label>
                    </motion.div>
                  )}
                </div>

                <div className="mx-1 h-px bg-black/7" />

                {/* Section 2: Modules Stack */}
                <div className="flex flex-col gap-1.5 px-0.5">
                  <span className="px-1.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/35">
                    {language === "tr" ? "Modüller" : "Modules"}
                  </span>

                  <div className="flex flex-wrap gap-1 2xl:flex-col">
                    {/* Notes Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all cursor-pointer 2xl:w-full",
                            invoiceData.showNotes !== false
                              ? "border-[#b8ca62]/45 bg-[#eef7bd]/55 font-semibold text-black shadow-xs"
                              : "border-transparent bg-transparent text-black/45 hover:border-black/8 hover:bg-white hover:text-black"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="size-3 text-black/60" />
                            {t.moduleNotes}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 shrink-0 rounded-full", invoiceData.showNotes !== false ? "bg-[#8ba000]" : "bg-black/20")} />
                            <ChevronLeft className="size-3 text-black/28" />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" align="center" collisionPadding={16} className="w-82 p-4 text-xs" sideOffset={12}>
                        <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7bd] text-[#637500]">
                              <FileText className="size-4" />
                            </span>
                            <div>
                              <p className="text-[12px] font-bold text-black/85">{language === "tr" ? "Notlar ve şartlar" : "Notes & terms"}</p>
                              <p className="mt-1 text-[10px] leading-4 text-black/42">{language === "tr" ? "Belgenin sonunda müşterinize gösterilecek açıklama." : "The message shown to your client at the end of the document."}</p>
                            </div>
                          </div>
                          <DockPopoverCloseButton language={language} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = invoiceData.showNotes === false;
                            setInvoiceData({ ...invoiceData, showNotes: next });
                            toast.success(next ? (language === "tr" ? "Notlar açıldı" : "Notes enabled") : (language === "tr" ? "Notlar gizlendi" : "Notes hidden"));
                          }}
                          className={cn(
                            "mt-3 flex h-9 w-full items-center justify-between rounded-xl px-3 text-[10px] font-semibold transition-colors",
                            invoiceData.showNotes !== false ? "bg-[#eef7bd] text-[#4d5d00]" : "bg-black/5 text-black/50"
                          )}
                        >
                          <span>{language === "tr" ? "Notları belgede göster" : "Show notes on document"}</span>
                          <span className={cn("rounded-full px-2 py-1", invoiceData.showNotes !== false ? "bg-white/70" : "bg-white")}>{invoiceData.showNotes !== false ? (language === "tr" ? "Açık" : "On") : (language === "tr" ? "Kapalı" : "Off")}</span>
                        </button>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="dock-notes" className="text-[10px] font-semibold text-black/52">{language === "tr" ? "Not metni" : "Note text"}</Label>
                            {invoiceData.billingType === "subscription" && (
                              <button type="button" onClick={() => setInvoiceData({ ...invoiceData, showNotes: true, notes: t.subscriptionNoteTemplate })} className="text-[9px] font-semibold text-[#687b00] hover:underline">
                                {language === "tr" ? "Abonelik şablonu" : "Subscription template"}
                              </button>
                            )}
                          </div>
                          <textarea
                            id="dock-notes"
                            rows={5}
                            value={invoiceData.notes}
                            onChange={(e) => setInvoiceData({ ...invoiceData, showNotes: true, notes: e.target.value })}
                            placeholder={invoiceData.billingType === "subscription" ? t.subscriptionNoteTemplate : (language === "tr" ? "Bizi tercih ettiğiniz için teşekkür ederiz." : "Thank you for choosing us.")}
                            className="flex min-h-28 w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[11px] leading-5 text-black/72 outline-none placeholder:text-black/28 focus:border-black/30 focus:ring-1 focus:ring-black/10"
                          />
                        </div>
                        <DockPopoverFooter language={language} />
                      </PopoverContent>
                    </Popover>

                    {/* Bank / IBAN Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all cursor-pointer 2xl:w-full",
                            invoiceData.showPaymentInfo
                              ? "border-[#b8ca62]/45 bg-[#eef7bd]/55 font-semibold text-black shadow-xs"
                              : "border-transparent bg-transparent text-black/45 hover:border-black/8 hover:bg-white hover:text-black"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <Building2 className="size-3 text-black/60" />
                            {t.modulePaymentInfo}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full shrink-0", invoiceData.showPaymentInfo ? "bg-[#8ba000]" : "bg-black/20")} />
                            <ChevronLeft className="size-3 text-black/28" />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" align="center" collisionPadding={16} className="w-82 p-4 text-xs" sideOffset={12}>
                        <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7bd] text-[#637500]">
                              <Building2 className="size-4" />
                            </span>
                            <div>
                              <p className="text-[12px] font-bold text-black/85">{t.paymentInfoTitle}</p>
                              <p className="mt-1 text-[10px] leading-4 text-black/42">{language === "tr" ? "Müşterinizin ödeme yapacağı hesap bilgileri." : "Account details your client can use for payment."}</p>
                            </div>
                          </div>
                          <DockPopoverCloseButton language={language} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !invoiceData.showPaymentInfo;
                            setInvoiceData({ ...invoiceData, showPaymentInfo: next });
                            toast.success(next ? (language === "tr" ? "Banka bilgisi aktif" : "Payment info enabled") : (language === "tr" ? "Banka bilgisi kapalı" : "Payment info disabled"));
                          }}
                          className={cn(
                            "mt-3 flex h-9 w-full items-center justify-between rounded-xl px-3 text-[10px] font-semibold transition-colors",
                            invoiceData.showPaymentInfo ? "bg-[#eef7bd] text-[#4d5d00]" : "bg-black/5 text-black/50"
                          )}
                        >
                          <span>{language === "tr" ? "Belgede göster" : "Show on document"}</span>
                          <span className={cn("rounded-full px-2 py-1", invoiceData.showPaymentInfo ? "bg-white/70" : "bg-white")}>{invoiceData.showPaymentInfo ? (language === "tr" ? "Açık" : "On") : (language === "tr" ? "Kapalı" : "Off")}</span>
                        </button>
                        <div className="mt-4 space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold text-black/52">{t.bankNameLabel}</Label>
                            <Input
                              value={invoiceData.bankName || ""}
                              onChange={(e) => setInvoiceData({ ...invoiceData, showPaymentInfo: true, bankName: e.target.value })}
                              placeholder={t.bankNamePlaceholder}
                              className="h-10 rounded-xl border-black/10 bg-white px-3 text-[11px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold text-black/52">{t.accountHolderLabel}</Label>
                            <Input
                              value={invoiceData.accountHolder || ""}
                              onChange={(e) => setInvoiceData({ ...invoiceData, showPaymentInfo: true, accountHolder: e.target.value })}
                              placeholder={t.accountHolderPlaceholder}
                              className="h-10 rounded-xl border-black/10 bg-white px-3 text-[11px]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold text-black/52">{t.ibanLabel}</Label>
                            <Input
                              value={invoiceData.iban || ""}
                              onChange={(e) => setInvoiceData({ ...invoiceData, showPaymentInfo: true, iban: e.target.value })}
                              placeholder={t.ibanPlaceholder}
                              className="h-10 rounded-xl border-black/10 bg-white px-3 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                        <DockPopoverFooter language={language} />
                      </PopoverContent>
                    </Popover>

                    {/* Discount Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all cursor-pointer 2xl:w-full",
                            invoiceData.showDiscount
                              ? "border-[#b8ca62]/45 bg-[#eef7bd]/55 font-semibold text-black shadow-xs"
                              : "border-transparent bg-transparent text-black/45 hover:border-black/8 hover:bg-white hover:text-black"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <Percent className="size-3 text-black/60" />
                            {t.moduleDiscount}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {invoiceData.showDiscount && invoiceData.discountRate ? (
                              <span className="font-mono text-[9.5px] font-bold text-[#6f8500]">%{invoiceData.discountRate}</span>
                            ) : (
                              <span className={cn("size-1.5 rounded-full shrink-0", invoiceData.showDiscount ? "bg-[#8ba000]" : "bg-black/20")} />
                            )}
                            <ChevronLeft className="size-3 text-black/28" />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" align="center" collisionPadding={16} className="w-78 p-4 text-xs" sideOffset={12}>
                        <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7bd] text-[#637500]">
                              <Percent className="size-4" />
                            </span>
                            <div>
                              <p className="text-[12px] font-bold text-black/85">{t.discountBadgeLabel}</p>
                              <p className="mt-1 text-[10px] leading-4 text-black/42">{language === "tr" ? "Ara toplam üzerinden uygulanacak indirimi belirleyin." : "Set a discount applied to the subtotal."}</p>
                            </div>
                          </div>
                          <DockPopoverCloseButton language={language} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !invoiceData.showDiscount;
                            setInvoiceData({ ...invoiceData, showDiscount: next });
                            toast.success(next ? (language === "tr" ? "İndirim aktif" : "Discount enabled") : (language === "tr" ? "İndirim kapalı" : "Discount disabled"));
                          }}
                          className={cn(
                            "mt-3 flex h-9 w-full items-center justify-between rounded-xl px-3 text-[10px] font-semibold transition-colors",
                            invoiceData.showDiscount ? "bg-[#eef7bd] text-[#4d5d00]" : "bg-black/5 text-black/50"
                          )}
                        >
                          <span>{language === "tr" ? "İndirimi uygula" : "Apply discount"}</span>
                          <span className={cn("rounded-full px-2 py-1", invoiceData.showDiscount ? "bg-white/70" : "bg-white")}>{invoiceData.showDiscount ? (language === "tr" ? "Açık" : "On") : (language === "tr" ? "Kapalı" : "Off")}</span>
                        </button>
                        <div className="mt-4 space-y-3">
                          <Label className="text-[10px] font-semibold text-black/52">{t.discountLabel}</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={invoiceData.discountRate || ""}
                              onChange={(e) => setInvoiceData({ ...invoiceData, showDiscount: true, discountRate: Number(e.target.value) })}
                              placeholder={t.discountPlaceholder}
                              className="h-11 rounded-xl border-black/10 bg-white px-3 pr-9 text-sm font-semibold"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-black/35">%</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[5, 10, 15, 20].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setInvoiceData({ ...invoiceData, showDiscount: true, discountRate: rate })}
                                className={cn("h-9 rounded-xl border text-[10px] font-semibold transition-colors", invoiceData.showDiscount && invoiceData.discountRate === rate ? "border-[#b8ca62] bg-[#eef7bd] text-[#4d5d00]" : "border-black/8 bg-white hover:border-black/18 hover:bg-black/[0.025]")}
                              >
                                %{rate}
                              </button>
                            ))}
                          </div>
                        </div>
                        <DockPopoverFooter language={language} />
                      </PopoverContent>
                    </Popover>

                    {/* Signature Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all cursor-pointer 2xl:w-full",
                            invoiceData.showSignature
                              ? "border-[#b8ca62]/45 bg-[#eef7bd]/55 font-semibold text-black shadow-xs"
                              : "border-transparent bg-transparent text-black/45 hover:border-black/8 hover:bg-white hover:text-black"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <PenTool className="size-3 text-black/60" />
                            {t.moduleSignature}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full shrink-0", invoiceData.showSignature ? "bg-[#8ba000]" : "bg-black/20")} />
                            <ChevronLeft className="size-3 text-black/28" />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" align="center" collisionPadding={16} className="w-78 p-4 text-xs" sideOffset={12}>
                        <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7bd] text-[#637500]">
                              <PenTool className="size-4" />
                            </span>
                            <div>
                              <p className="text-[12px] font-bold text-black/85">{t.signatureBoxTitle}</p>
                              <p className="mt-1 text-[10px] leading-4 text-black/42">{language === "tr" ? "Belgenin sonuna imza ve kaşe alanı ekleyin." : "Add a signature and stamp area to the document."}</p>
                            </div>
                          </div>
                          <DockPopoverCloseButton language={language} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !invoiceData.showSignature;
                            setInvoiceData({ ...invoiceData, showSignature: next });
                            toast.success(next ? (language === "tr" ? "İmza alanı aktif" : "Signature enabled") : (language === "tr" ? "İmza alanı kapalı" : "Signature disabled"));
                          }}
                          className={cn(
                            "mt-3 flex h-9 w-full items-center justify-between rounded-xl px-3 text-[10px] font-semibold transition-colors",
                            invoiceData.showSignature ? "bg-[#eef7bd] text-[#4d5d00]" : "bg-black/5 text-black/50"
                          )}
                        >
                          <span>{language === "tr" ? "İmza alanını göster" : "Show signature area"}</span>
                          <span className={cn("rounded-full px-2 py-1", invoiceData.showSignature ? "bg-white/70" : "bg-white")}>{invoiceData.showSignature ? (language === "tr" ? "Açık" : "On") : (language === "tr" ? "Kapalı" : "Off")}</span>
                        </button>
                        <div className="mt-4 space-y-1.5">
                          <Label className="text-[10px] font-semibold text-black/52">{t.signatureTitleLabel}</Label>
                          <Input
                            value={invoiceData.signatureTitle ?? (language === "tr" ? "Yetkili İmza / Kaşe" : "Authorized Signature")}
                            onChange={(e) => setInvoiceData({ ...invoiceData, showSignature: true, signatureTitle: e.target.value })}
                            placeholder={t.signatureTitlePlaceholder}
                            className="h-10 rounded-xl border-black/10 bg-white px-3 text-[11px]"
                          />
                        </div>
                        <DockPopoverFooter language={language} />
                      </PopoverContent>
                    </Popover>

                    {/* Due Date Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all cursor-pointer 2xl:w-full",
                            invoiceData.showDueDate
                              ? "border-[#b8ca62]/45 bg-[#eef7bd]/55 font-semibold text-black shadow-xs"
                              : "border-transparent bg-transparent text-black/45 hover:border-black/8 hover:bg-white hover:text-black"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <CalendarClock className="size-3 text-black/60" />
                            {t.moduleDueDate}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-1.5 rounded-full shrink-0", invoiceData.showDueDate ? "bg-[#8ba000]" : "bg-black/20")} />
                            <ChevronLeft className="size-3 text-black/28" />
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" align="center" collisionPadding={16} className="w-auto p-4 text-xs" sideOffset={12}>
                        <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7bd] text-[#637500]">
                              <CalendarClock className="size-4" />
                            </span>
                            <div>
                              <p className="text-[12px] font-bold text-black/85">{t.dueDateBadgeLabel}</p>
                              <p className="mt-1 max-w-52 text-[10px] leading-4 text-black/42">{language === "tr" ? "Ödeme veya teklif geçerlilik tarihini seçin." : "Choose the payment or quote validity date."}</p>
                            </div>
                          </div>
                          <DockPopoverCloseButton language={language} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !invoiceData.showDueDate;
                            setInvoiceData({ ...invoiceData, showDueDate: next });
                            toast.success(next ? (language === "tr" ? "Vade tarihi aktif" : "Due date enabled") : (language === "tr" ? "Vade tarihi kapalı" : "Due date disabled"));
                          }}
                          className={cn(
                            "mt-3 flex h-9 w-full items-center justify-between rounded-xl px-3 text-[10px] font-semibold transition-colors",
                            invoiceData.showDueDate ? "bg-[#eef7bd] text-[#4d5d00]" : "bg-black/5 text-black/50"
                          )}
                        >
                          <span>{language === "tr" ? "Tarihi belgede göster" : "Show date on document"}</span>
                          <span className={cn("rounded-full px-2 py-1", invoiceData.showDueDate ? "bg-white/70" : "bg-white")}>{invoiceData.showDueDate ? (language === "tr" ? "Açık" : "On") : (language === "tr" ? "Kapalı" : "Off")}</span>
                        </button>
                        <div className="mt-3 rounded-xl border border-black/8 bg-white p-1">
                          <Calendar
                            mode="single"
                            selected={parseTrDate(invoiceData.dueDate || getFutureDate(1))}
                            onSelect={(date) => {
                              if (date) {
                                setInvoiceData({ ...invoiceData, showDueDate: true, dueDate: format(date, "dd.MM.yyyy") });
                              }
                            }}
                            initialFocus
                            locale={language === "en" ? enUS : tr}
                          />
                        </div>
                        <DockPopoverFooter language={language} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mx-1 h-px bg-black/7" />

                {/* Section 3: Document Locale */}
                <div className="flex flex-col gap-1.5 px-0.5">
                  <span className="px-1.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/35">
                    {language === "tr" ? "Dil ve para birimi" : "Language & currency"}
                  </span>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-black/8 bg-white/55 p-2">
                    <div className="min-w-0 space-y-1">
                      <span className="block px-1 text-[8px] font-semibold text-black/38">
                        {language === "tr" ? "Dil" : "Language"}
                      </span>
                      <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
                        <SelectTrigger aria-label={t.languageLabel} className="h-9 w-full min-w-0 rounded-lg border-black/8 bg-white px-2.5 text-[10.5px] font-semibold shadow-none focus:ring-0 cursor-pointer">
                          <span className="whitespace-nowrap">{language === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}</span>
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <span className="block px-1 text-[8px] font-semibold text-black/38">
                        {language === "tr" ? "Para birimi" : "Currency"}
                      </span>
                      <Select value={currency} onValueChange={(val: Currency) => setCurrency(val)}>
                        <SelectTrigger aria-label={t.currencyLabel} className="h-9 w-full min-w-0 rounded-lg border-black/8 bg-white px-2.5 font-geist text-[10.5px] font-semibold shadow-none focus:ring-0 cursor-pointer">
                          <span className="whitespace-nowrap">{CURRENCIES[currency]?.symbol} {currency}</span>
                        </SelectTrigger>
                        <SelectContent align="end">
                          {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                            <SelectItem key={c} value={c}>
                              {CURRENCIES[c].symbol} {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="mx-1 h-px bg-black/7" />

                {/* Section 4: PDF Font Selector */}
                <div className="flex flex-col gap-1.5 px-0.5 pb-0.5">
                  <span className="px-1.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/35">
                    {t.fontSelectorLabel}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[11px] font-semibold text-black shadow-xs transition-all hover:border-black/20 hover:bg-white cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Type className="size-3 text-black/60 shrink-0" />
                          <span className="truncate">
                            {t[PDF_FONTS.find((f) => f.id === (invoiceData.pdfFont || "plex"))?.labelKey as keyof typeof t] || "IBM Plex Sans"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 shrink-0 rounded-full bg-[#8ba000]" />
                          <ChevronLeft className="size-3 text-black/28" />
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="left" align="center" collisionPadding={16} className="w-72 p-4 text-xs" sideOffset={12}>
                      <div className="flex items-start justify-between gap-3 border-b border-black/8 pb-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7bd] text-[#637500]">
                            <Type className="size-4" />
                          </span>
                          <div>
                            <p className="text-[12px] font-bold text-black/85">{t.fontSelectorLabel}</p>
                            <p className="mt-1 text-[10px] leading-4 text-black/42">{language === "tr" ? "PDF belgenizin karakterini belirleyin." : "Choose the character of your PDF document."}</p>
                          </div>
                        </div>
                        <DockPopoverCloseButton language={language} />
                      </div>
                      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-0.5">
                        {PDF_FONTS.map((item) => {
                          const isSelected = (invoiceData.pdfFont || "plex") === item.id;
                          return (
                            <PopoverClose asChild key={item.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setInvoiceData({ ...invoiceData, pdfFont: item.id });
                                  toast.success(`${t[item.labelKey as keyof typeof t]} ${language === "tr" ? "yazı tipi seçildi" : "font selected"}`);
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer",
                                  isSelected
                                    ? "border-[#171815] bg-[#171815] text-white shadow-xs"
                                    : "border-transparent text-black/80 hover:border-black/8 hover:bg-white"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className={cn("text-[11px] font-medium leading-tight", item.fontClass)}>
                                    {t[item.labelKey as keyof typeof t]}
                                  </span>
                                  <span className={cn("mt-0.5 text-[8.5px] leading-tight", isSelected ? "text-[#dff568]" : "text-black/40")}>
                                    {t[item.subKey as keyof typeof t]}
                                  </span>
                                </div>
                                <span className={cn("rounded-lg px-2 py-1 text-sm font-bold", item.fontClass, isSelected ? "bg-white/12 text-white" : "bg-black/5 text-black/40")}>
                                  {item.sample}
                                </span>
                              </button>
                            </PopoverClose>
                          );
                        })}
                      </div>
                      <p className="mt-3 border-t border-black/8 pt-3 text-[9px] leading-4 text-black/35">{language === "tr" ? "Bir yazı tipi seçtiğinizde panel otomatik kapanır." : "This panel closes automatically after you select a font."}</p>
                    </PopoverContent>
                  </Popover>
                </div>
              </aside>
            </div>
          </div>
        </>
      )}

      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative flex flex-col items-center text-center"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:bg-muted rounded-full cursor-pointer"
              onClick={() => setShowSupportModal(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 fill-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">{t.supportTitle}</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t.supportDesc}
            </p>

            <Button
              onClick={() => window.open("https://buymeacoffee.com/emirulucay", "_blank")}
              className="w-full py-6 text-base font-bold bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black shadow-md cursor-pointer mb-3"
            >
              <Coffee className="w-5 h-5 mr-2" />
              {t.buyCoffee}
            </Button>
            <Button
              onClick={() => window.open('https://github.com/emirulucay/quote', '_blank')}
              className="w-full py-6 text-base font-bold bg-[#24292e] hover:bg-[#24292e]/90 text-white shadow-md cursor-pointer mb-1 border-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {t.starGithub}
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2 text-muted-foreground cursor-pointer"
              onClick={() => setShowSupportModal(false)}
            >
              {t.maybeLater}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
