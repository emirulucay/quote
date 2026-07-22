"use client";

import Image from "next/image";
import { useRef, useState, ChangeEvent } from "react";
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
import { Trash2, Plus, Download, Upload, X, Coffee, Heart, Globe, Coins, ArrowLeft, ArrowRight, Check } from "lucide-react";
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

const formatCurrency = (value: number, curr: Currency = "TRY", lang: Language = "tr") => {
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

export default function Home() {
  const state = useInvoiceState();
  const printRef = useRef<HTMLDivElement>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);

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
      saveAsNewProfile({
        profileName: companyName,
        companyName,
        contactInfo,
        logoBase64: DEFAULT_COMPANY_LOGO
      });
      setNewCompanyName("");
      setNewContactInfo("");
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
    <div className="flex flex-col gap-1.5 mt-1">
      <Label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
        {t.footerPreviewTitle}
      </Label>
      <div className="p-3.5 border border-dashed border-border rounded-lg bg-muted/20 flex flex-col items-center text-center">
        <p className="font-bold text-base text-primary">
          {newCompanyName || (language === "tr" ? "Ad Soyad / Şirket" : "Full Name or Company Name")}
        </p>
        <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1 leading-relaxed">
          {newContactInfo || (language === "tr" ? "Email: info@sirket.com\nTel: +90 555 123 4567\nAdres: İstanbul, Türkiye" : "Email: info@company.com\nPhone: +1 555 123 4567\nAddress: New York, USA")}
        </p>
      </div>
    </div>
  );

  // STEP 1 & STEP 2 ONBOARDING
  if (forceProfileCreation) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/30 p-4 font-plex">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center mb-4">
              <Image src="/QUOTE.svg" alt="Quote Logo" width={100} height={48} className="h-12 w-auto object-contain" priority quality={100} />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={cn("h-2 rounded-full transition-all duration-300", onboardingStep === 1 ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30")} />
              <div className={cn("h-2 rounded-full transition-all duration-300", onboardingStep === 2 ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30")} />
            </div>

            {onboardingStep === 1 ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-primary">{t.onboardingStep1Title}</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.onboardingStep1Desc}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-primary">{t.onboardingStep2Title}</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.onboardingStep2Desc}
                </p>
              </>
            )}
          </div>

          {onboardingStep === 1 ? (
            <div className="flex flex-col gap-6 mt-2">
              {/* Language Selection */}
              <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {t.languageLabel}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage("tr")}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                      language === "tr"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                        : "border-border bg-background hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <span className="text-lg">🇹🇷</span> Türkçe
                    {language === "tr" && <Check className="w-4 h-4 ml-auto text-primary" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                      language === "en"
                        ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                        : "border-border bg-background hover:border-primary/50 text-muted-foreground"
                    )}
                  >
                    <span className="text-lg">🇬🇧</span> English
                    {language === "en" && <Check className="w-4 h-4 ml-auto text-primary" />}
                  </button>
                </div>
              </div>

              {/* Currency Selection */}
              <div className="flex flex-col gap-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" /> {t.currencyLabel}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(CURRENCIES) as Currency[]).map((currCode) => {
                    const c = CURRENCIES[currCode];
                    const isSelected = currency === currCode;
                    return (
                      <button
                        key={currCode}
                        type="button"
                        onClick={() => setCurrency(currCode)}
                        className={cn(
                          "flex items-center justify-between p-3.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                            : "border-border bg-background hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        <span className="font-mono text-base font-bold">{c.symbol}</span>
                        <span>{c.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full mt-2 py-6 text-lg cursor-pointer"
                onClick={() => setOnboardingStep(2)}
              >
                {t.continueButton} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="new-company-name">{t.companyNameLabel}</Label>
                <Input
                  id="new-company-name"
                  placeholder={t.companyNamePlaceholder}
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-contact-info">{t.contactInfoLabel}</Label>
                <textarea
                  id="new-contact-info"
                  placeholder={t.contactInfoPlaceholder}
                  value={newContactInfo}
                  onChange={(e) => setNewContactInfo(e.target.value)}
                  className="flex min-h-22.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                />
              </div>

              {/* Live Preview */}
              {renderFooterPreview()}

              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  className="py-6 px-4 cursor-pointer"
                  onClick={() => setOnboardingStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> {t.backButton}
                </Button>
                <Button
                  className="flex-1 py-6 text-lg cursor-pointer"
                  onClick={handleCreateProfile}
                >
                  {t.getStartedButton}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-background relative font-plex">

      {/* Custom Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-lg shadow-2xl border border-border w-full max-w-95 flex flex-col gap-5 font-plex relative">
            <button
              onClick={() => {
                setNewTaxName("");
                setNewTaxRate("");
                setShowTaxModal(false);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-primary cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-xl text-primary">{t.customTaxModalTitle}</h3>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-tax-name">{t.customTaxNameLabel}</Label>
              <Input
                id="custom-tax-name"
                placeholder={t.customTaxNamePlaceholder}
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-tax-rate">{t.customTaxRateLabel}</Label>
              <Input
                id="custom-tax-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder={t.customTaxRatePlaceholder}
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewTaxName("");
                  setNewTaxRate("");
                  setShowTaxModal(false);
                }}
                className="cursor-pointer"
              >
                {t.cancelButton}
              </Button>
              <Button onClick={handleSaveCustomTax} className="cursor-pointer">
                {t.addTaxButton}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (Used when adding subsequent profiles) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-100 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-lg shadow-2xl border border-border w-full max-w-110 flex flex-col gap-5 font-plex relative">
            <button
              onClick={() => {
                setNewCompanyName("");
                setNewContactInfo("");
                setShowProfileModal(false);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-primary cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-xl text-primary">{t.newProfileTitle}</h3>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modal-company-name">{t.companyNameLabel}</Label>
              <Input
                id="modal-company-name"
                placeholder={t.companyNamePlaceholder}
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modal-contact-info">{t.contactInfoLabel}</Label>
              <textarea
                id="modal-contact-info"
                placeholder={t.contactInfoPlaceholder}
                value={newContactInfo}
                onChange={(e) => setNewContactInfo(e.target.value)}
                className="flex min-h-22.5 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              />
            </div>

            {/* Live Preview */}
            {renderFooterPreview()}

            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewCompanyName("");
                  setNewContactInfo("");
                  setShowProfileModal(false);
                }}
                className="cursor-pointer"
              >
                {t.cancelButton}
              </Button>
              <Button onClick={handleCreateProfile} className="cursor-pointer">{t.saveButton}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeProfile && (
        <>
          {/* Left Panel */}
          <div className="w-full lg:w-112.5 xl:w-125 h-full border-r border-border bg-surface shrink-0 flex flex-col relative z-10">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8">

              {/* Profile Switcher & Logo */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{t.profileSectionTitle}</h2>

                  {/* Minimal Language & Currency Switcher */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
                      <SelectTrigger className="h-7 px-3 w-auto shrink-0 border border-border bg-background hover:bg-muted font-medium text-xs rounded-full shadow-none focus:ring-0 gap-1.5 cursor-pointer whitespace-nowrap">
                        <span>{language === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}</span>
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="tr">🇹🇷 TR</SelectItem>
                        <SelectItem value="en">🇬🇧 EN</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={currency} onValueChange={(val: Currency) => setCurrency(val)}>
                      <SelectTrigger className="h-7 px-3 w-auto shrink-0 border border-border bg-background hover:bg-muted font-mono font-semibold text-xs rounded-full shadow-none focus:ring-0 gap-1.5 cursor-pointer whitespace-nowrap">
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
                <div className="flex gap-2 items-center">
                  <Select value={activeProfileId} onValueChange={setActiveProfileId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t.selectProfilePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.companyName || p.profileName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowProfileModal(true)} className="cursor-pointer">
                    {t.addNewProfile}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 p-3 border border-border rounded-md bg-background">
                  {activeProfile.logoBase64 ? (
                    <Image src={activeProfile.logoBase64} alt="Logo" width={48} height={48} className="w-12 h-12 object-contain bg-white rounded border border-border" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border border-dashed border-border text-[10px] leading-tight text-center text-muted-foreground p-1">{t.noLogo}</div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <span className="text-sm font-semibold">{activeProfile.companyName}</span>
                    <Label className="text-xs text-accent hover:text-accent-hover cursor-pointer mt-1 inline-flex items-center gap-1 w-fit">
                      <Upload className="w-3 h-3" /> {t.changeLogo}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </Label>
                  </div>
                </div>
              </section>

              {/* Invoice Details */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-bold">{t.invoiceDetailsTitle}</h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t.dateLabel}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal cursor-pointer",
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
                        <SelectTrigger className="cursor-pointer">
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
                          <SelectItem value="add-custom-tax" className="font-semibold text-accent cursor-pointer border-t border-border mt-1 pt-1">
                            {t.addCustomTaxOption}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientName">{t.clientNameLabel}</Label>
                    <Input
                      id="clientName"
                      value={invoiceData.clientName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                      placeholder={t.clientNamePlaceholder}
                      onFocus={() => {
                        if (
                          invoiceData.clientName === "Muhammet Bilal Apaydın" ||
                          invoiceData.clientName === "Müşteri Adı" ||
                          invoiceData.clientName === "Client Name"
                        ) {
                          setInvoiceData({ ...invoiceData, clientName: "" });
                        }
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Line Items */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-bold">{t.servicesTitle}</h2>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {lineItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <Input
                            id={`service-name-${item.id}`}
                            placeholder={t.serviceNamePlaceholder}
                            value={item.name}
                            maxLength={65}
                            onChange={(e) => updateLineItem(item.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            placeholder={t.quantityPlaceholder}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={t.pricePlaceholder}
                            value={item.price}
                            onChange={(e) => updateLineItem(item.id, { price: e.target.value === "" ? "" : Number(e.target.value) })}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-danger hover:bg-danger/10 shrink-0 cursor-pointer"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button
                    variant="dashed"
                    className="mt-2 w-full cursor-pointer"
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
            <div className="shrink-0 p-6 md:p-8 border-t border-border bg-surface">
              <Button onClick={handleDownloadPDF} className="w-full py-6 text-base shadow-lg cursor-pointer">
                <Download className="w-5 h-5 mr-2" />
                {t.downloadPdfButton}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 h-full bg-muted flex flex-col items-center p-8 overflow-y-auto relative">
            {/* A4 Paper */}
            <div
              ref={printRef}
              className="pdf-container bg-white w-full max-w-198.5 shrink-0 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-16 flex flex-col justify-start"
              style={{ aspectRatio: "1/1.414" }}
            >
              {/* Centered Title */}
              <div className="text-center mb-12 mt-8">
                <h1 className="text-2xl font-bold uppercase tracking-widest text-primary mb-2">{t.documentTitle}</h1>
                <p className="font-mono text-muted-foreground">{invoiceData.date}</p>
              </div>

              {/* Client Info */}
              <div className="mb-16 text-center">
                <h3 className="text-sm font-bold uppercase text-muted-foreground mb-2">{t.clientHeader}</h3>
                <p className="text-2xl font-medium">{invoiceData.clientName}</p>
              </div>

              {/* Table */}
              <div className="flex-1">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="border-b-2 border-primary text-primary font-bold uppercase">
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
                          <td className="py-4 font-medium wrap-break-word pr-2 align-middle" title={item.name || t.unnamedService}>
                            {item.name || t.unnamedService}
                          </td>
                          <td className="py-4 text-center font-mono align-middle">{item.quantity}</td>
                          <td className="py-4 text-right font-mono align-middle">{formatCurrency(Number(item.price) || 0, currency, language)}</td>
                          <td className="py-4 text-right font-mono font-bold text-primary align-middle">
                            {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0), currency, language)}
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
                        <span className="font-mono text-sm">{formatCurrency(subtotal, currency, language)}</span>
                      </div>
                    )}
                    {invoiceData.kdvRate > 0 && (
                      <div className="flex justify-between py-2 text-muted-foreground">
                        <span className="font-medium text-sm">{invoiceData.taxName || "KDV"} (%{invoiceData.kdvRate})</span>
                        <span className="font-mono text-sm">{formatCurrency(kdvAmount, currency, language)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-4 border-t-2 border-primary">
                      <span className="font-bold text-lg uppercase tracking-tight">{t.totalLabel}</span>
                      <span className="font-mono font-bold text-2xl text-primary">{formatCurrency(total, currency, language)}</span>
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
