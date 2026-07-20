import { useState, useEffect } from "react";
import { Profile, LineItem, InvoiceData } from "../types";
import { toast } from "sonner";

export const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1605106325682-3482f7c1c9c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwyfHxtaW5pbWFsJTIwZ2VvbWV0cmljJTIwbG9nb3xlbnwwfHx8fDE3ODQ1NDExNzF8MA&ixlib=rb-4.1.0&q=85";
export const DEFAULT_CLIENT_LOGO = "https://images.pexels.com/photos/19023561/pexels-photo-19023561.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const getInitialDate = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const emptyInvoiceData: InvoiceData = {
  clientName: "Müşteri Adı",
  date: getInitialDate(),
  notes: "Bizi tercih ettiğiniz için teşekkür ederiz.",
  kdvRate: 0,
};

export function useInvoiceState() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(emptyInvoiceData);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
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

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("invoice-profiles", JSON.stringify(profiles));
    }
  }, [profiles, isLoaded]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

  const updateProfile = (id: string, data: Partial<Profile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const saveAsNewProfile = (data: Partial<Profile>) => {
    const newId = crypto.randomUUID();
    const newProfile: Profile = {
      id: newId,
      profileName: data.profileName || `Yeni Profil (${profiles.length + 1})`,
      companyName: data.companyName || "",
      contactInfo: data.contactInfo || "",
      logoBase64: data.logoBase64 || DEFAULT_COMPANY_LOGO,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
    toast.success("Yeni profil oluşturuldu");
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: 1, price: "" },
    ]);
  };

  const updateLineItem = (id: string, data: Partial<LineItem>) => {
    setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    isLoaded,
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
  };
}
