"use client";

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
import { Trash2, Plus, Download, Upload, X } from "lucide-react";
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

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
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
          <div className="text-center">
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
          <div className="w-full lg:w-[450px] xl:w-[500px] h-full overflow-y-auto border-r border-border bg-surface p-6 md:p-8 shrink-0 flex flex-col gap-8">
            
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeProfile.logoBase64} alt="Logo" className="w-12 h-12 object-contain bg-white rounded border border-border" />
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
                  onClick={addLineItem}
                  disabled={lineItems.length >= 7}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {lineItems.length >= 7 ? "Maksimum Hizmet Sınırı (7)" : "Hizmet Ekle"}
                </Button>
              </div>
            </section>

            {/* Download Button */}
            <div className="mt-auto pt-8">
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
              className="bg-white w-full max-w-[794px] shrink-0 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-16 flex flex-col justify-start"
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
                <div className="grid grid-cols-12 gap-4 border-b-2 border-primary pb-3 mb-4 text-sm font-bold uppercase text-primary">
                  <div className="col-span-6">Hizmet</div>
                  <div className="col-span-2 text-center">Miktar</div>
                  <div className="col-span-2 text-right">Fiyat</div>
                  <div className="col-span-2 text-right">Toplam</div>
                </div>

                {lineItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground mb-4">
                    Henüz hizmet eklenmedi.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mb-8">
                    {lineItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 text-sm items-center border-b border-border pb-4">
                        <div className="col-span-6 font-medium text-sm truncate pr-2" title={item.name || "İsimsiz Hizmet"}>{item.name || "İsimsiz Hizmet"}</div>
                        <div className="col-span-2 text-center font-mono">{item.quantity}</div>
                        <div className="col-span-2 text-right font-mono">{formatCurrency(Number(item.price) || 0)}</div>
                        <div className="col-span-2 text-right font-mono font-bold text-primary">
                          {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeProfile.logoBase64} alt="Company Logo" className="h-16 object-contain max-w-[200px]" />
                <div className="flex flex-col">
                  <p className="font-bold text-lg">{activeProfile.companyName}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{activeProfile.contactInfo}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
