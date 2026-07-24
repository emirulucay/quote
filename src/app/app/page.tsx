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
import { Trash2, Plus, Download, Upload, X, Coffee, Heart, Globe, Coins, ArrowLeft, ArrowRight, Check, ShieldCheck, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DEFAULT_COMPANY_LOGO } from "@/hooks/use-invoice-state";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CURRENCIES, Language, Currency } from "@/lib/i18n";

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
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [expandedDescriptions, setExpandedDescriptions] = useState<string[]>([]);

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newContactInfo, setNewContactInfo] = useState("");

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
    customTaxes,
    allTaxes,
    addCustomTax,
    t,
  } = state;

  const forceProfileCreation = profiles.length === 0;

  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const kdvAmount = subtotal * ((invoiceData.kdvRate || 0) / 100);
  const total = subtotal + kdvAmount;

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
        updateProfile(editingProfileId, { profileName: companyName, companyName, contactInfo });
        toast.success(language === "tr" ? "Profil güncellendi" : "Profile updated");
      } else {
        saveAsNewProfile({ profileName: companyName, companyName, contactInfo, logoBase64: DEFAULT_COMPANY_LOGO });
      }
      setNewCompanyName("");
      setNewContactInfo("");
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

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile(activeProfile.id, { logoBase64: reader.result as string });
        toast.success(t.logoUpdated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Footer Preview Component for Modals & Onboarding
  const renderFooterPreview = () => (
    <div className="flex flex-col gap-2 mt-1">
      <Label lang="en" className="text-[10px] text-black/35 font-semibold uppercase tracking-[0.12em]">
        {t.footerPreviewTitle}
      </Label>
      <div className="rounded-2xl border border-black/8 bg-[#f5f3ee] p-4 border-l-2 border-l-[#dff568]">
        <p className="font-semibold text-sm text-primary">
          {newCompanyName || (language === "tr" ? "Ad Soyad / Şirket" : "Full Name or Company Name")}
        </p>
        <p className="text-xs text-black/42 whitespace-pre-wrap mt-1.5 leading-5">
          {newContactInfo || (language === "tr" ? "Email: info@sirket.com\nTel: +90 555 123 4567\nAdres: İstanbul, Türkiye" : "Email: info@company.com\nPhone: +1 555 123 4567\nAddress: New York, USA")}
        </p>
      </div>
    </div>
  );

  // STEP 1 & STEP 2 ONBOARDING
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
                {language === "tr" ? "Çalışma alanınızı iki kısa adımda hazırlayın. Bilgileriniz yalnızca bu tarayıcıda saklanır." : "Set up your workspace in two quick steps. Your information stays in this browser."}
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
                <span className="font-mono text-[10px] text-black/35">0{onboardingStep} / 02</span>
                <div className="flex gap-1.5">
                  {[1, 2].map((step) => <span key={step} className={cn("h-1.5 rounded-full transition-all duration-300", onboardingStep === step ? "w-8 bg-[#171815]" : "w-2 bg-black/12")} />)}
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
                            return <button key={option.code} type="button" onClick={() => setLanguage(option.code)} className={cn("group flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left transition-all sm:px-5", selected ? "border-[#171815] bg-white shadow-[0_7px_20px_rgba(20,21,18,0.07)] ring-1 ring-[#171815]" : "border-black/9 bg-white/45 text-black/48 hover:border-black/25 hover:bg-white")}><span className="text-xl">{option.flag}</span><span className="text-sm font-semibold sm:text-base">{option.label}</span><span className={cn("ml-auto flex size-6 items-center justify-center rounded-full transition-colors", selected ? "bg-[#dff568] text-black" : "border border-black/10 text-transparent")}><Check className="size-3.5" /></span></button>;
                          })}
                        </div>
                      </fieldset>

                      <fieldset>
                        <legend lang="en" className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42"><Coins className="size-3.5" />{t.currencyLabel}</legend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(Object.keys(CURRENCIES) as Currency[]).map((currCode) => {
                            const c = CURRENCIES[currCode]; const selected = currency === currCode;
                            return <button key={currCode} type="button" onClick={() => setCurrency(currCode)} className={cn("relative flex min-h-24 flex-col justify-between rounded-2xl border p-4 text-left transition-all", selected ? "border-[#171815] bg-[#171815] text-white shadow-[0_8px_24px_rgba(20,21,18,0.16)]" : "border-black/9 bg-white/45 text-black/48 hover:border-black/25 hover:bg-white")}><span className={cn("font-geist text-lg font-medium leading-none", selected && "text-[#dff568]")}>{c.symbol}</span><span className="text-xs font-semibold tracking-wider">{c.code}</span>{selected && <span className="absolute right-3 top-3 size-2 rounded-full bg-[#dff568]" />}</button>;
                          })}
                        </div>
                      </fieldset>
                    </div>

                    <button type="button" className="group mt-9 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#171815] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,21,18,0.16)] transition-all hover:-translate-y-0.5 hover:bg-black" onClick={() => { setOnboardingStep(2); setTimeout(() => document.getElementById("new-company-name")?.focus(), 50); }}>
                      {t.continueButton}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="profile" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.28 }} className="w-full max-w-2xl">
                    <p lang="en" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#728600]">02 · {language === "tr" ? "Profil" : "Profile"}</p>
                    <h1 className="mt-4 text-4xl font-medium leading-tight tracking-[-0.04em] !text-[#171815] sm:text-5xl">{t.onboardingStep2Title}</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-black/48 sm:text-base">{t.onboardingStep2Desc}</p>

                    <div className="mt-8 grid gap-5">
                      <div className="grid gap-2"><Label lang="en" htmlFor="new-company-name" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/48">{t.companyNameLabel}</Label><Input id="new-company-name" placeholder={t.companyNamePlaceholder} value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} autoFocus className="h-14 rounded-xl border-black/10 bg-white px-4 text-base shadow-none focus-visible:ring-[#171815]" /></div>
                      <div className="grid gap-2"><Label lang="en" htmlFor="new-contact-info" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/48">{language === "tr" ? "E-posta, telefon ve adres" : t.contactInfoLabel}</Label><textarea id="new-contact-info" placeholder={language === "tr" ? "E-posta: merhaba@sirket.com\nTelefon: +90 555 123 45 67\nAdres: istanbul, Türkiye" : "Email: hello@company.com\nPhone: +1 555 123 4567\nAddress: New York, USA"} value={newContactInfo} onChange={(e) => setNewContactInfo(e.target.value)} className="flex min-h-32 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none placeholder:whitespace-pre-line placeholder:text-black/28 focus:border-black/35 focus:ring-1 focus:ring-black/20" /></div>
                      <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_7px_24px_rgba(20,21,18,0.05)]"><p lang="en" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35">{language === "tr" ? "Fatura altbilgisi · canlı önizleme" : t.footerPreviewTitle}</p><div className="mt-4 border-l-2 border-[#dff568] pl-4"><p className="font-semibold text-[#171815]">{newCompanyName || (language === "tr" ? "Ad Soyad / Şirket" : "Full name or company")}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-black/42">{newContactInfo || (language === "tr" ? "E-posta\nTelefon\nAdres" : "Email\nPhone\nAddress")}</p></div></div>
                    </div>

                    <div className="mt-8 flex gap-3"><button type="button" onClick={() => setOnboardingStep(1)} className="flex size-14 shrink-0 items-center justify-center rounded-full border border-black/12 bg-white transition-colors hover:bg-black/5" aria-label={t.backButton}><ArrowLeft className="size-4" /></button><button type="button" onClick={handleCreateProfile} className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-full bg-[#171815] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,21,18,0.16)] transition-all hover:-translate-y-0.5 hover:bg-black">{t.getStartedButton}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button></div>
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

      {/* Main Content */}
      {activeProfile && (
        <>
          <h1 className="sr-only">Quote – Minimal & Fast Invoice Generator</h1>
          {/* Left Panel */}
          <div className="w-full lg:w-120 xl:w-132 h-full border-r border-black/8 bg-[#fbfaf7] shrink-0 flex flex-col relative z-10 shadow-[12px_0_40px_rgba(20,21,18,0.04)]">
            <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7 lg:px-8 flex flex-col gap-8">

              {/* Profile Switcher & Logo */}
              <section className="flex flex-col gap-4 border-b border-black/8 pb-7">
                <div className="flex items-center justify-between">
                  <div>
                    <QuoteLogo className="h-6 w-auto" />
                    <p className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-black/35">{language === "tr" ? "YENI TEKLIF" : "NEW QUOTE"}</p>
                  </div>

                  {/* Minimal Language & Currency Switcher */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
                      <SelectTrigger className="h-9 px-3 w-auto shrink-0 border border-black/10 bg-white hover:bg-black/3 font-medium text-xs rounded-full shadow-none focus:ring-0 gap-1.5 cursor-pointer whitespace-nowrap">
                        <span>{language === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}</span>
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="tr">🇹🇷 TR</SelectItem>
                        <SelectItem value="en">🇬🇧 EN</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={currency} onValueChange={(val: Currency) => setCurrency(val)}>
                      <SelectTrigger className="h-9 px-3 w-auto shrink-0 border border-black/10 bg-white hover:bg-black/3 font-geist font-semibold text-xs rounded-full shadow-none focus:ring-0 gap-1.5 cursor-pointer whitespace-nowrap">
                        <span>{CURRENCIES[currency]?.symbol} {currency}</span>
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
                  <Button variant="outline" onClick={() => { setEditingProfileId(null); setConfirmingProfileDelete(false); setNewCompanyName(""); setNewContactInfo(""); setShowProfileModal(true); }} className="h-11 rounded-xl border-black/10 bg-white px-4 cursor-pointer">
                    <Plus className="size-4" /><span className="sr-only sm:not-sr-only sm:ml-1">{t.addNewProfile}</span>
                  </Button>
                  <Button variant="outline" size="icon" aria-label={language === "tr" ? "Profili düzenle" : "Edit profile"} onClick={() => { setEditingProfileId(activeProfile.id); setConfirmingProfileDelete(false); setNewCompanyName(activeProfile.companyName); setNewContactInfo(activeProfile.contactInfo); setShowProfileModal(true); }} className="size-11 rounded-xl border-black/10 bg-white text-black/45 cursor-pointer hover:text-black">
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
                <Label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-black/12 bg-white/65 p-3 transition-all hover:border-black/28 hover:bg-white">
                  {activeProfile.logoBase64 ? (
                    <Image src={activeProfile.logoBase64} alt="Logo" width={56} height={56} className="size-12 object-contain bg-white rounded-xl border border-black/8" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#f1efe9] text-black/32 transition-colors group-hover:bg-[#dff568]/55 group-hover:text-black"><Upload className="size-4" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-black/72">{language === "tr" ? "Şirket logosu" : "Company logo"}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-black/35">{activeProfile.logoBase64 ? (language === "tr" ? "Değiştirmek için tıklayın" : "Click to replace") : (language === "tr" ? "PNG, JPG veya SVG yükleyin" : "Upload PNG, JPG or SVG")}</span>
                  </div>
                  <span className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[10px] font-semibold text-black/55 transition-colors group-hover:border-black/20 group-hover:text-black">{activeProfile.logoBase64 ? t.changeLogo : (language === "tr" ? "Logo yükle" : "Upload logo")}</span>
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </Label>
              </section>

              {/* Invoice Details */}
              <section className="flex flex-col gap-5">
                <div className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-[#dff568] font-mono text-[10px] font-bold">01</span><h2 className="text-xl font-semibold tracking-[-0.025em]">{t.invoiceDetailsTitle}</h2></div>
                <div className="grid gap-4">
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
                              setInvoiceData({
                                ...invoiceData,
                                kdvRate: selected.rate,
                                taxName: selected.name,
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
                          {allTaxes.map((tax) => (
                            <SelectItem key={tax.id} value={tax.id}>
                              {tax.rate === 0
                                ? t.kdvNone
                                : `${tax.name} (%${tax.rate})`}
                            </SelectItem>
                          ))}
                          <SelectItem value="add-custom-tax" className="mt-1 pt-3 font-semibold text-[#667800] cursor-pointer before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-black/8 data-[state=checked]:bg-transparent">
                            {t.addCustomTaxOption}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Line Items */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-[#dff568] font-mono text-[10px] font-bold">02</span><h2 className="text-xl font-semibold tracking-[-0.025em]">{t.servicesTitle}</h2></div><span className="text-[11px] text-black/35">{lineItems.length} / 7</span></div>
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
          <div className="flex-1 h-full bg-[#ebe9e3] flex flex-col items-center px-6 pb-12 pt-6 overflow-y-auto relative lg:px-10">
            <div className="pointer-events-none fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-white/70 bg-[#fbfaf7]/90 px-3.5 py-2 text-[10px] font-medium text-black/48 shadow-[0_8px_24px_rgba(20,21,18,0.12)] backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-[#8ba000]" />
              {language === "tr" ? "Otomatik kaydedilir" : "Autosaved"}
            </div>
            {/* A4 Paper */}
            <div
              ref={printRef}
              className="pdf-container bg-white w-full max-w-198.5 shrink-0 overflow-hidden shadow-[0_24px_70px_-22px_rgba(20,21,18,0.2)] p-16 flex flex-col justify-start"
              style={{ aspectRatio: "1/1.414" }}
            >
              {/* Centered Title */}
              <div className="text-center mb-12 mt-8">
                <h1 lang="en" className="text-2xl font-bold uppercase tracking-widest text-primary mb-2">{t.documentTitle}</h1>
                <p className="font-mono text-muted-foreground">{invoiceData.date}</p>
              </div>

              {/* Client Info */}
              <div className="mb-16 text-center">
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

                <div className="flex justify-end mt-8">
                  <div className="w-1/2 flex flex-col gap-2">
                    {invoiceData.kdvRate > 0 && (
                      <div className="flex justify-between py-2 text-muted-foreground">
                        <span className="font-medium text-sm">{t.subtotalLabel}</span>
                        <span className="font-geist tabular-nums text-sm">{formatCurrency(subtotal, currency)}</span>
                      </div>
                    )}
                    {invoiceData.kdvRate > 0 && (
                      <div className="flex justify-between py-2 text-muted-foreground">
                        <span className="font-medium text-sm">{invoiceData.taxName || "KDV"} (%{invoiceData.kdvRate})</span>
                        <span className="font-geist tabular-nums text-sm">{formatCurrency(kdvAmount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-4 border-t-2 border-primary">
                      <span className="font-bold text-lg uppercase tracking-tight">{t.totalLabel}</span>
                      <span className="font-geist tabular-nums font-bold text-2xl text-primary">{formatCurrency(total, currency)}</span>
                    </div>
                  </div>
                </div>
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
