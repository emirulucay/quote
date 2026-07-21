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
import { Trash2, Plus, Download, Upload, X, Coffee, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DEFAULT_COMPANY_LOGO } from "@/hooks/use-invoice-state";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
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

    // Zorla tek sayfaya sığdırıyoruz
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
    const profileName = (document.getElementById("new-profile-name") as HTMLInputElement).value;
    const companyName = (document.getElementById("new-company-name") as HTMLInputElement).value;
    const contactInfo = (document.getElementById("new-contact-info") as HTMLTextAreaElement).value;

    if (companyName) {
      saveAsNewProfile({
        profileName: profileName || companyName,
        companyName,
        contactInfo,
        logoBase64: DEFAULT_COMPANY_LOGO
      });
      setShowProfileModal(false);
    } else {
      toast.error("Şirket/Ad kısmı zorunludur");
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile(activeProfile.id, { logoBase64: reader.result as string });
        toast.success("Logo güncellendi");
      };
      reader.readAsDataURL(file);
    }
  };

  if (forceProfileCreation) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/30 p-4 font-plex">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center mb-6">
              <Image src="/QUOTE.svg" alt="Quote Logo" width={100} height={48} className="h-12 w-auto object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Hoş Geldiniz</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Fatura oluşturmaya başlamak için önce şirketinizi veya serbest çalışan profilinizi oluşturun.
            </p>
          </div>

          <div className="grid gap-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="new-profile-name">Profil Adı (Sizin için)</Label>
              <Input id="new-profile-name" placeholder="Örn: Freelance İşim" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-company-name">Faturada Görünecek Şirket / Adınız *</Label>
              <Input id="new-company-name" placeholder="Ad Soyad veya Şirket" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-contact-info">İletişim Bilgileri</Label>
              <textarea
                id="new-contact-info"
                placeholder="Email, Telefon, Adres"
                className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              />
            </div>
            <Button className="w-full mt-2 py-6 text-lg" onClick={handleCreateProfile}>Hemen Başla</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-background relative">

      {/* Profile Modal (Used when adding subsequent profiles) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-lg shadow-2xl border border-border w-full max-w-[400px] flex flex-col gap-6 font-plex relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-xl text-primary">Yeni Profil Oluştur</h3>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-profile-name">Profil Adı (Sizin için)</Label>
              <Input id="new-profile-name" placeholder="Örn: Freelance İşim" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-company-name">Faturada Görünecek Şirket / Adınız *</Label>
              <Input id="new-company-name" placeholder="Ad Soyad veya Şirket" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-contact-info">İletişim Bilgileri</Label>
              <textarea
                id="new-contact-info"
                placeholder="Email, Telefon, Adres"
                className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="ghost" onClick={() => setShowProfileModal(false)}>İptal</Button>
              <Button onClick={handleCreateProfile}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeProfile && (
        <>
          {/* Left Panel */}
          <div className="w-full lg:w-[450px] xl:w-[500px] h-full border-r border-border bg-surface shrink-0 flex flex-col relative z-10">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8">

              {/* Profile Switcher & Logo */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-bold">Profil</h2>
                <div className="flex gap-2 items-center">
                  <Select value={activeProfileId} onValueChange={setActiveProfileId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Profil Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.profileName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowProfileModal(true)}>
                    Yeni Ekle
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 p-3 border border-border rounded-md bg-background">
                  {activeProfile.logoBase64 ? (
                    <Image src={activeProfile.logoBase64} alt="Logo" width={48} height={48} className="w-12 h-12 object-contain bg-white rounded border border-border" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border border-dashed border-border text-[10px] leading-tight text-center text-muted-foreground p-1">Logo Yok</div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <span className="text-sm font-semibold">{activeProfile.companyName}</span>
                    <Label className="text-xs text-accent hover:text-accent-hover cursor-pointer mt-1 inline-flex items-center gap-1 w-fit">
                      <Upload className="w-3 h-3" /> Logoyu Değiştir
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
                <h2 className="text-xl font-bold">Fatura Detayları</h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tarih</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !invoiceData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceData.date ? invoiceData.date : <span>Tarih Seçin</span>}
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
                            locale={tr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label>KDV Oranı</Label>
                      <Select
                        value={String(invoiceData.kdvRate || 0)}
                        onValueChange={(val) => setInvoiceData({ ...invoiceData, kdvRate: Number(val) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="KDV" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">KDV Yok (%0)</SelectItem>
                          <SelectItem value="10">%10 KDV</SelectItem>
                          <SelectItem value="20">%20 KDV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientName">Müşteri Adı</Label>
                    <Input
                      id="clientName"
                      value={invoiceData.clientName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              {/* Line Items */}
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-bold">Hizmetler</h2>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {lineItems.map((item, idx) => (
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
                            placeholder="Hizmet Adı"
                            value={item.name}
                            maxLength={65}
                            onChange={(e) => updateLineItem(item.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Adet"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Fiyat"
                            value={item.price}
                            onChange={(e) => updateLineItem(item.id, { price: e.target.value === "" ? "" : Number(e.target.value) })}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-danger hover:bg-danger/10 shrink-0"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button
                    variant="dashed"
                    className="mt-2 w-full"
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
                    {lineItems.length >= 7 ? "Maksimum Hizmet Sınırı (7)" : "Hizmet Ekle"}
                  </Button>
                </div>
              </section>

            </div>
            {/* Action Buttons */}
            <div className="shrink-0 p-6 md:p-8 border-t border-border bg-surface">
              <Button onClick={handleDownloadPDF} className="w-full py-6 text-base shadow-lg">
                <Download className="w-5 h-5 mr-2" />
                PDF Olarak İndir
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 h-full bg-muted flex flex-col items-center p-8 overflow-y-auto relative">
            {/* A4 Paper */}
            <div
              ref={printRef}
              className="pdf-container bg-white w-full max-w-[794px] shrink-0 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-16 flex flex-col justify-start"
              style={{ aspectRatio: "1/1.414" }}
            >
              {/* Centered Title */}
              <div className="text-center mb-12 mt-8">
                <h1 className="text-2xl font-bold uppercase tracking-widest text-primary mb-2">Hizmet Özeti</h1>
                <p className="font-mono text-muted-foreground">{invoiceData.date}</p>
              </div>

              {/* Client Info */}
              <div className="mb-16 text-center">
                <h3 className="text-sm font-bold uppercase text-muted-foreground mb-2">Sayın</h3>
                <p className="text-2xl font-medium">{invoiceData.clientName}</p>
              </div>

              {/* Table */}
              <div className="flex-1">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr className="border-b-2 border-primary text-primary font-bold uppercase">
                      <th className="py-3 text-left w-1/2 font-bold">Hizmet</th>
                      <th className="py-3 text-center w-1/6 font-bold">Miktar</th>
                      <th className="py-3 text-right w-1/6 font-bold">Fiyat</th>
                      <th className="py-3 text-right w-1/6 font-bold">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Henüz hizmet eklenmedi.
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-border">
                          <td className="py-4 font-medium break-words pr-2 align-middle" title={item.name || "İsimsiz Hizmet"}>
                            {item.name || "İsimsiz Hizmet"}
                          </td>
                          <td className="py-4 text-center font-mono align-middle">{item.quantity}</td>
                          <td className="py-4 text-right font-mono align-middle">{formatCurrency(Number(item.price) || 0)}</td>
                          <td className="py-4 text-right font-mono font-bold text-primary align-middle">
                            {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}
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
                        <span className="font-medium text-sm">Ara Toplam</span>
                        <span className="font-mono text-sm">{formatCurrency(subtotal)}</span>
                      </div>
                    )}
                    {invoiceData.kdvRate > 0 && (
                      <div className="flex justify-between py-2 text-muted-foreground">
                        <span className="font-medium text-sm">KDV (%{invoiceData.kdvRate})</span>
                        <span className="font-mono text-sm">{formatCurrency(kdvAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-4 border-t-2 border-primary">
                      <span className="font-bold text-lg uppercase tracking-tight">Genel Toplam</span>
                      <span className="font-mono font-bold text-2xl text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer (Logo & Freelancer Info) */}
              <div className="mt-auto pt-12 flex flex-col items-center text-center gap-4">
                {activeProfile.logoBase64 && (
                  <Image src={activeProfile.logoBase64} alt="Company Logo" width={200} height={64} className="h-16 w-auto object-contain max-w-[200px]" />
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

            <h2 className="text-2xl font-bold mb-2">Tebrikler!</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Teklif dosyanız başarıyla indirildi. Eğer bu ücretsiz aracı faydalı bulduysanız, geliştiriciye ufak bir destek olmak ister misiniz?
            </p>

            <Button
              onClick={() => window.open("https://buymeacoffee.com/emirulucay", "_blank")}
              className="w-full py-6 text-base font-bold bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black shadow-md cursor-pointer mb-3"
            >
              <Coffee className="w-5 h-5 mr-2" />
              Geliştiriciye Kahve Ismarla
            </Button>
            <Button
              onClick={() => window.open('https://github.com/emirulucay/recete-pdf', '_blank')}
              className="w-full py-6 text-base font-bold bg-[#24292e] hover:bg-[#24292e]/90 text-white shadow-md cursor-pointer mb-1 border-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub'da Yıldızla
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2 text-muted-foreground cursor-pointer"
              onClick={() => setShowSupportModal(false)}
            >
              Belki daha sonra
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
