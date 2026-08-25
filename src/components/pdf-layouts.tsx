"use client";

import React from "react";
import Image from "next/image";
import { Building2, CalendarClock } from "lucide-react";
import { InvoiceData, Profile, LineItem, Currency, Language } from "@/types";

export interface PdfLayoutProps {
  invoiceData: InvoiceData;
  activeProfile: Profile;
  lineItems: LineItem[];
  currency: Currency;
  language: Language;
  t: Record<string, string>;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxableBase: number;
  kdvAmount: number;
  total: number;
  formatCurrency: (value: number, curr?: Currency) => string;
  getFutureDate: (monthsToAdd?: number) => string;
}

// 1. MODERN MINIMAL LAYOUT (Default)
export function ModernPdfLayout(props: PdfLayoutProps) {
  const {
    invoiceData,
    activeProfile,
    lineItems,
    currency,
    language,
    t,
    subtotal,
    discountRate,
    discountAmount,
    kdvAmount,
    total,
    formatCurrency,
    getFutureDate,
  } = props;

  return (
    <div className="flex w-full flex-1 flex-col justify-start">
      {/* Centered Title */}
      <div className="mb-10 mt-6 text-center">
        <h1 lang="en" className="mb-2 text-2xl font-bold uppercase tracking-widest text-[#171815]">
          {invoiceData.title?.trim() ||
            (invoiceData.billingType === "subscription"
              ? t.subscriptionDocumentTitle
              : t.documentTitle)}
        </h1>
        <div className="flex items-center justify-center gap-2 font-mono text-sm text-[#737373]">
          <span>{invoiceData.date}</span>
          {invoiceData.billingType === "subscription" && (
            <>
              <span>•</span>
              <span className="font-semibold text-[#171815]">
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
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#e3e2dc] bg-[#f5f3ee] px-3 py-1 text-[11px] font-medium text-[#4c4c4c]">
            <CalendarClock className="size-3 text-[#7f7f7f]" />
            <span>
              {t.dueDatePrefix}: {invoiceData.dueDate}
            </span>
          </div>
        )}
        {invoiceData.billingType === "subscription" &&
          (invoiceData.periodStart || invoiceData.periodEnd) && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e3e2dc] bg-[#f5f3ee] px-4 py-1.5 text-xs font-medium text-[#171815]">
              <span className="size-1.5 rounded-full bg-[#8ba000]" />
              <span>
                {t.billingPeriodLabel}: {invoiceData.periodStart || invoiceData.date} –{" "}
                {invoiceData.periodEnd || getFutureDate(12)}
              </span>
              {invoiceData.autoRenewal && (
                <span className="rounded-full bg-[#eceae4] px-2 py-0.5 text-[10px] font-semibold text-[#666666]">
                  {t.autoRenewalLabel}
                </span>
              )}
            </div>
          )}
      </div>

      {/* Client Info */}
      <div className="mb-14 text-center">
        <h3 lang="en" className="mb-2 text-sm font-bold uppercase text-[#737373]">
          {t.clientHeader}
        </h3>
        <p className="text-2xl font-medium text-[#171815]">{invoiceData.clientName}</p>
      </div>

      {/* Table */}
      <div className="flex-1">
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr lang="en" className="border-b-2 border-[#171815] font-bold uppercase text-[#171815]">
              <th className="w-1/2 py-3 text-left font-bold">{t.thService}</th>
              <th className="w-1/6 py-3 text-center font-bold">{t.thQuantity}</th>
              <th className="w-1/6 py-3 text-right font-bold">{t.thPrice}</th>
              <th className="w-1/6 py-3 text-right font-bold">{t.thTotal}</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#737373]">
                  {t.noServicesAdded}
                </td>
              </tr>
            ) : (
              lineItems.map((item) => (
                <tr key={item.id} className="border-b border-[#e5e5e8]">
                  <td className="wrap-break-word py-4 pr-3 align-middle" title={item.name || t.unnamedService}>
                    <span className="font-medium text-[#171815]">{item.name || t.unnamedService}</span>
                    {item.description && (
                      <span className="mt-1 block text-xs font-normal leading-5 text-[#737373]">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-center font-mono align-middle text-[#171815]">{item.quantity}</td>
                  <td className="font-geist py-4 text-right tabular-nums align-middle text-[#171815]">
                    {formatCurrency(Number(item.price) || 0, currency)}
                  </td>
                  <td className="font-geist py-4 text-right font-bold tabular-nums text-[#171815] align-middle">
                    {formatCurrency(
                      (Number(item.quantity) || 0) * (Number(item.price) || 0),
                      currency
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals Calculation Box */}
        <div className="mt-8 flex justify-end">
          <div className="flex w-1/2 flex-col gap-1.5">
            {(invoiceData.kdvRate > 0 || (invoiceData.showDiscount && discountRate > 0)) && (
              <div className="flex justify-between py-1.5 text-sm text-[#737373]">
                <span className="font-medium">{t.subtotalLabel}</span>
                <span className="font-geist tabular-nums text-[#171815]">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
            )}
            {invoiceData.showDiscount && discountRate > 0 && (
              <div className="flex justify-between py-1.5 text-sm text-red-600">
                <span className="font-medium">
                  {t.discountBadgeLabel} (%{discountRate})
                </span>
                <span className="font-geist font-medium tabular-nums">
                  -{formatCurrency(discountAmount, currency)}
                </span>
              </div>
            )}
            {invoiceData.kdvRate > 0 && (
              <div className="flex justify-between py-1.5 text-sm text-[#737373]">
                <span className="font-medium">
                  {!invoiceData.taxId ||
                  invoiceData.taxId.startsWith("tax-") ||
                  invoiceData.taxName === "KDV" ||
                  invoiceData.taxName === "VAT" ||
                  invoiceData.taxName === "VAT / Tax"
                    ? t.kdvTaxLabel
                    : invoiceData.taxName}{" "}
                  (%{invoiceData.kdvRate})
                </span>
                <span className="font-geist tabular-nums text-[#171815]">
                  {formatCurrency(kdvAmount, currency)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t-2 border-[#171815] py-3">
              <span className="text-lg font-bold uppercase tracking-tight text-[#171815]">
                {t.totalLabel}
              </span>
              <div className="text-right">
                <span className="font-geist text-2xl font-bold tabular-nums text-[#171815]">
                  {formatCurrency(total, currency)}
                </span>
                {invoiceData.billingType === "subscription" && (
                  <span className="font-geist ml-1.5 text-sm font-semibold text-[#737373]">
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
        {invoiceData.showPaymentInfo &&
          (invoiceData.bankName || invoiceData.iban || invoiceData.accountHolder) && (
            <div className="mt-6 rounded-xl border border-[#eceae4] bg-[#fbfaf7] p-3.5 text-xs">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#171815]">
                <Building2 className="size-3 text-[#666666]" />
                {t.paymentInfoTitle}
              </p>
              <div className="grid grid-cols-1 gap-2 text-[#404040] sm:grid-cols-2">
                {invoiceData.bankName && (
                  <div>
                    <span className="font-medium text-[#8c8c8c]">{t.bankNameLabel}: </span>
                    <span className="font-medium text-[#171815]">{invoiceData.bankName}</span>
                  </div>
                )}
                {invoiceData.accountHolder && (
                  <div>
                    <span className="font-medium text-[#8c8c8c]">{t.accountHolderLabel}: </span>
                    <span className="font-medium text-[#171815]">{invoiceData.accountHolder}</span>
                  </div>
                )}
                {invoiceData.iban && (
                  <div className="col-span-full font-mono text-[11px]">
                    <span className="font-sans font-medium text-[#8c8c8c]">{t.ibanLabel}: </span>
                    <span className="font-semibold text-[#171815]">{invoiceData.iban}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Notes & Terms on PDF */}
        {invoiceData.showNotes !== false && invoiceData.notes && (
          <div className="mt-4 rounded-xl border border-[#eeebe5] bg-[#fbfaf7] p-4 text-xs text-[#737373]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#171815]">
              {language === "tr" ? "Notlar ve Şartlar" : "Notes & Terms"}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-[#4c4c4c]">{invoiceData.notes}</p>
          </div>
        )}

        {/* Signature & Stamp Area on PDF */}
        {invoiceData.showSignature && (
          <div className="mt-8 flex justify-end">
            <div className="w-56 border-t border-[#999999] pt-2 text-center">
              <p className="text-xs font-semibold text-[#171815]">
                {invoiceData.signatureTitle || t.signatureLineText}
              </p>
              <p className="mt-0.5 text-[9px] text-[#737373]">{invoiceData.date}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer (Logo & Freelancer Info) */}
      <div className="mt-auto flex flex-col items-center gap-4 pt-12 text-center">
        {activeProfile.logoBase64 && (
          <Image
            src={activeProfile.logoBase64}
            alt="Company Logo"
            width={200}
            height={64}
            className="max-w-50 h-16 w-auto object-contain"
          />
        )}
        <div className="flex flex-col">
          <p className="text-lg font-bold text-[#171815]">{activeProfile.companyName}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#737373]">{activeProfile.contactInfo}</p>
        </div>
      </div>
    </div>
  );
}

// 2. CORPORATE CLASSIC LAYOUT
export function CorporatePdfLayout(props: PdfLayoutProps) {
  const {
    invoiceData,
    activeProfile,
    lineItems,
    currency,
    language,
    t,
    subtotal,
    discountRate,
    discountAmount,
    kdvAmount,
    total,
    formatCurrency,
    getFutureDate,
  } = props;

  const docTitle =
    invoiceData.title?.trim() ||
    (invoiceData.billingType === "subscription"
      ? t.subscriptionDocumentTitle
      : t.documentTitle);

  return (
    <div className="flex w-full flex-1 flex-col justify-start">
      {/* Top Header: Split Brand & Metadata */}
      <div className="flex items-start justify-between gap-6 border-b-2 border-[#171815] pb-6">
        {/* Left: Company Brand & Info */}
        <div className="flex items-center gap-4">
          {activeProfile.logoBase64 && (
            <Image
              src={activeProfile.logoBase64}
              alt="Company Logo"
              width={160}
              height={56}
              className="h-14 w-auto max-w-[130px] object-contain"
            />
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#171815]">
              {activeProfile.companyName}
            </h2>
            <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs leading-relaxed text-[#555555]">
              {activeProfile.contactInfo}
            </p>
          </div>
        </div>

        {/* Right: Document Details Box */}
        <div className="text-right">
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#171815]">
            {docTitle}
          </h1>
          <div className="mt-2.5 inline-flex flex-col items-end gap-1 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#666666]">{t.dateLabel}:</span>
              <span className="font-mono font-medium text-[#171815]">{invoiceData.date}</span>
            </div>
            {invoiceData.showDueDate && invoiceData.dueDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#666666]">{t.dueDatePrefix}:</span>
                <span className="font-mono font-medium text-[#171815]">{invoiceData.dueDate}</span>
              </div>
            )}
            {invoiceData.billingType === "subscription" && (
              <div className="mt-1 flex items-center gap-1.5 rounded-full bg-[#171815] px-2 py-0.5 text-[10px] font-semibold text-white">
                <span>
                  {invoiceData.billingCycle === "monthly"
                    ? t.cycleMonthlyBadge
                    : invoiceData.billingCycle === "quarterly"
                    ? t.cycleQuarterlyBadge
                    : t.cycleYearlyBadge}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Info Row */}
      <div className="my-6 grid grid-cols-2 gap-6 rounded-lg border border-[#e5e7eb] bg-[#fdfdfd] p-4 text-xs">
        <div>
          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#777777]">
            {t.clientHeader}
          </span>
          <p className="mt-1 text-base font-bold text-[#171815]">{invoiceData.clientName}</p>
        </div>
        {invoiceData.billingType === "subscription" && (
          <div className="text-right">
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#777777]">
              {t.billingPeriodLabel}
            </span>
            <p className="mt-1 font-mono font-medium text-[#171815]">
              {invoiceData.periodStart || invoiceData.date} – {invoiceData.periodEnd || getFutureDate(12)}
            </p>
            {invoiceData.autoRenewal && (
              <span className="mt-1 inline-block text-[10px] font-medium text-[#666666]">
                • {t.autoRenewalLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Structured Table with shaded header */}
      <div className="flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-y border-[#d1d5db] bg-[#f3f4f6] font-bold uppercase text-[#171815]">
              <th className="w-1/2 px-3 py-2.5 text-left">{t.thService}</th>
              <th className="w-1/6 px-3 py-2.5 text-center">{t.thQuantity}</th>
              <th className="w-1/6 px-3 py-2.5 text-right">{t.thPrice}</th>
              <th className="w-1/6 px-3 py-2.5 text-right">{t.thTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#737373]">
                  {t.noServicesAdded}
                </td>
              </tr>
            ) : (
              lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-black/[0.01]">
                  <td className="px-3 py-3.5 align-middle">
                    <span className="font-semibold text-[#171815]">{item.name || t.unnamedService}</span>
                    {item.description && (
                      <span className="mt-0.5 block text-[11px] font-normal leading-4 text-[#666666]">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono align-middle text-[#171815]">{item.quantity}</td>
                  <td className="font-geist px-3 py-3.5 text-right tabular-nums align-middle text-[#171815]">
                    {formatCurrency(Number(item.price) || 0, currency)}
                  </td>
                  <td className="font-geist px-3 py-3.5 text-right font-bold tabular-nums text-[#171815] align-middle">
                    {formatCurrency(
                      (Number(item.quantity) || 0) * (Number(item.price) || 0),
                      currency
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Lower Grid: Payment & Notes (Left) / Calculations & Signature (Right) */}
        <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] items-start gap-6">
          <div className="space-y-3">
            {invoiceData.showPaymentInfo &&
              (invoiceData.bankName || invoiceData.iban || invoiceData.accountHolder) && (
                <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-[11px]">
                  <p className="mb-1.5 flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-[#171815]">
                    <Building2 className="size-3 text-[#555555]" />
                    {t.paymentInfoTitle}
                  </p>
                  <div className="space-y-1 text-[#444444]">
                    {invoiceData.bankName && (
                      <div>
                        <span className="font-medium text-[#777777]">{t.bankNameLabel}: </span>
                        <span className="font-semibold text-[#171815]">{invoiceData.bankName}</span>
                      </div>
                    )}
                    {invoiceData.accountHolder && (
                      <div>
                        <span className="font-medium text-[#777777]">{t.accountHolderLabel}: </span>
                        <span className="font-semibold text-[#171815]">{invoiceData.accountHolder}</span>
                      </div>
                    )}
                    {invoiceData.iban && (
                      <div className="font-mono text-[10.5px]">
                        <span className="font-sans font-medium text-[#777777]">{t.ibanLabel}: </span>
                        <span className="font-bold text-[#171815]">{invoiceData.iban}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {invoiceData.showNotes !== false && invoiceData.notes && (
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-[11px]">
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-[#171815]">
                  {language === "tr" ? "Notlar ve Şartlar" : "Notes & Terms"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed text-[#555555]">{invoiceData.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3.5 text-xs">
              {(invoiceData.kdvRate > 0 || (invoiceData.showDiscount && discountRate > 0)) && (
                <div className="flex justify-between py-1 text-[#666666]">
                  <span>{t.subtotalLabel}</span>
                  <span className="font-geist tabular-nums text-[#171815]">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>
              )}
              {invoiceData.showDiscount && discountRate > 0 && (
                <div className="flex justify-between py-1 text-red-600">
                  <span>{t.discountBadgeLabel} (%{discountRate})</span>
                  <span className="font-geist font-medium tabular-nums">
                    -{formatCurrency(discountAmount, currency)}
                  </span>
                </div>
              )}
              {invoiceData.kdvRate > 0 && (
                <div className="flex justify-between py-1 text-[#666666]">
                  <span>
                    {!invoiceData.taxId ||
                    invoiceData.taxId.startsWith("tax-") ||
                    invoiceData.taxName === "KDV" ||
                    invoiceData.taxName === "VAT" ||
                    invoiceData.taxName === "VAT / Tax"
                      ? t.kdvTaxLabel
                      : invoiceData.taxName}{" "}
                    (%{invoiceData.kdvRate})
                  </span>
                  <span className="font-geist tabular-nums text-[#171815]">
                    {formatCurrency(kdvAmount, currency)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between rounded-md bg-[#171815] p-2.5 text-white">
                <span className="font-bold uppercase tracking-tight text-xs">{t.totalLabel}</span>
                <div className="text-right">
                  <span className="font-geist text-xl font-black tabular-nums text-white">
                    {formatCurrency(total, currency)}
                  </span>
                  {invoiceData.billingType === "subscription" && (
                    <span className="font-geist ml-1 text-xs font-semibold text-white/70">
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

            {invoiceData.showSignature && (
              <div className="mt-8 w-52 border-t-2 border-[#171815] pt-2 text-center">
                <p className="text-xs font-bold text-[#171815]">
                  {invoiceData.signatureTitle || t.signatureLineText}
                </p>
                <p className="mt-0.5 text-[9px] text-[#777777]">{invoiceData.date}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. CREATIVE EDITORIAL / ACCENT LAYOUT
export function CreativePdfLayout(props: PdfLayoutProps) {
  const {
    invoiceData,
    activeProfile,
    lineItems,
    currency,
    language,
    t,
    subtotal,
    discountRate,
    discountAmount,
    kdvAmount,
    total,
    formatCurrency,
    getFutureDate,
  } = props;

  const docTitle =
    invoiceData.title?.trim() ||
    (invoiceData.billingType === "subscription"
      ? t.subscriptionDocumentTitle
      : t.documentTitle);

  return (
    <div className="relative flex w-full flex-1 flex-col justify-start pl-6">
      {/* Visual Accent Left Line */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full bg-[#171815]" />

      {/* Top Header: Asymmetric Typography */}
      <div className="flex items-start justify-between gap-6 pb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#737373]">
            {activeProfile.companyName || "QUOTE"}
          </span>
          <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[#171815]">
            {docTitle}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-black/10 bg-[#f5f3ee] px-3 py-1 font-mono text-xs font-semibold text-[#171815]">
              {invoiceData.date}
            </span>
            {invoiceData.showDueDate && invoiceData.dueDate && (
              <span className="rounded-full border border-black/10 bg-[#f5f3ee] px-3 py-1 text-xs font-semibold text-[#4c4c4c]">
                {t.dueDatePrefix}: {invoiceData.dueDate}
              </span>
            )}
            {invoiceData.billingType === "subscription" && (
              <span className="rounded-full bg-[#171815] px-3 py-1 text-xs font-bold text-[#dff568]">
                {invoiceData.billingCycle === "monthly"
                  ? t.cycleMonthlyBadge
                  : invoiceData.billingCycle === "quarterly"
                  ? t.cycleQuarterlyBadge
                  : t.cycleYearlyBadge}
              </span>
            )}
          </div>
        </div>

        {activeProfile.logoBase64 && (
          <Image
            src={activeProfile.logoBase64}
            alt="Company Logo"
            width={160}
            height={60}
            className="h-14 w-auto max-w-[130px] object-contain"
          />
        )}
      </div>

      {/* Client Section */}
      <div className="mb-8 mt-2 rounded-2xl border border-black/8 bg-[#fbfaf7] p-5">
        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-[#787878]">
          {t.clientHeader}
        </span>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[#171815]">
          {invoiceData.clientName}
        </p>
        {invoiceData.billingType === "subscription" && (
          <p className="mt-1 font-mono text-xs text-[#666666]">
            {t.billingPeriodLabel}: {invoiceData.periodStart || invoiceData.date} –{" "}
            {invoiceData.periodEnd || getFutureDate(12)}
            {invoiceData.autoRenewal ? ` (${t.autoRenewalLabel})` : ""}
          </p>
        )}
      </div>

      {/* Minimal Editorial Table */}
      <div className="flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-[#171815] font-black uppercase text-[#171815]">
              <th className="w-1/2 pb-3 text-left">{t.thService}</th>
              <th className="w-1/6 pb-3 text-center">{t.thQuantity}</th>
              <th className="w-1/6 pb-3 text-right">{t.thPrice}</th>
              <th className="w-1/6 pb-3 text-right">{t.thTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/8">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#737373]">
                  {t.noServicesAdded}
                </td>
              </tr>
            ) : (
              lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-3 align-middle">
                    <span className="font-bold text-[#171815]">{item.name || t.unnamedService}</span>
                    {item.description && (
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-[#666666]">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-center font-mono font-medium text-[#171815] align-middle">
                    {item.quantity}
                  </td>
                  <td className="font-geist py-3.5 text-right tabular-nums text-[#171815] align-middle">
                    {formatCurrency(Number(item.price) || 0, currency)}
                  </td>
                  <td className="font-geist py-3.5 text-right font-black tabular-nums text-[#171815] align-middle">
                    {formatCurrency(
                      (Number(item.quantity) || 0) * (Number(item.price) || 0),
                      currency
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Calculation & Total Box */}
        <div className="mt-6 flex justify-end">
          <div className="w-72 rounded-2xl border border-black/8 bg-[#f5f3ee] p-4 text-xs">
            {(invoiceData.kdvRate > 0 || (invoiceData.showDiscount && discountRate > 0)) && (
              <div className="flex justify-between py-1 text-[#666666]">
                <span>{t.subtotalLabel}</span>
                <span className="font-geist font-medium tabular-nums text-[#171815]">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
            )}
            {invoiceData.showDiscount && discountRate > 0 && (
              <div className="flex justify-between py-1 text-red-600">
                <span>{t.discountBadgeLabel} (%{discountRate})</span>
                <span className="font-geist font-semibold tabular-nums">
                  -{formatCurrency(discountAmount, currency)}
                </span>
              </div>
            )}
            {invoiceData.kdvRate > 0 && (
              <div className="flex justify-between py-1 text-[#666666]">
                <span>
                  {!invoiceData.taxId ||
                  invoiceData.taxId.startsWith("tax-") ||
                  invoiceData.taxName === "KDV" ||
                  invoiceData.taxName === "VAT" ||
                  invoiceData.taxName === "VAT / Tax"
                    ? t.kdvTaxLabel
                    : invoiceData.taxName}{" "}
                  (%{invoiceData.kdvRate})
                </span>
                <span className="font-geist font-medium tabular-nums text-[#171815]">
                  {formatCurrency(kdvAmount, currency)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between border-t border-black/15 pt-2">
              <span className="text-sm font-extrabold uppercase tracking-tight text-[#171815]">
                {t.totalLabel}
              </span>
              <div className="text-right">
                <span className="font-geist text-2xl font-black tabular-nums text-[#171815]">
                  {formatCurrency(total, currency)}
                </span>
                {invoiceData.billingType === "subscription" && (
                  <span className="font-geist ml-1 text-xs font-bold text-[#666666]">
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

        {/* Lower Info & Signature */}
        <div className="mt-8 grid grid-cols-2 items-end gap-6 border-t border-black/10 pt-6">
          <div className="space-y-3">
            {invoiceData.showPaymentInfo &&
              (invoiceData.bankName || invoiceData.iban || invoiceData.accountHolder) && (
                <div className="text-[11px] text-[#444444]">
                  <p className="font-bold uppercase tracking-wider text-[#171815] text-[10px] mb-1">
                    {t.paymentInfoTitle}
                  </p>
                  <p>{invoiceData.bankName} {invoiceData.accountHolder ? `• ${invoiceData.accountHolder}` : ""}</p>
                  {invoiceData.iban && <p className="font-mono text-[10px] font-semibold mt-0.5">{invoiceData.iban}</p>}
                </div>
              )}

            {invoiceData.showNotes !== false && invoiceData.notes && (
              <div className="text-[11px] text-[#666666]">
                <p className="font-bold uppercase tracking-wider text-[#171815] text-[10px] mb-1">
                  {language === "tr" ? "Notlar" : "Notes"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{invoiceData.notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-[#171815]">{activeProfile.companyName}</p>
              <p className="whitespace-pre-wrap text-xs text-[#737373] mt-0.5">{activeProfile.contactInfo}</p>
            </div>
          </div>

          {invoiceData.showSignature && (
            <div className="flex justify-end">
              <div className="w-48 border-t-2 border-[#171815] pt-2 text-center">
                <p className="text-xs font-bold text-[#171815]">
                  {invoiceData.signatureTitle || t.signatureLineText}
                </p>
                <p className="mt-0.5 text-[9px] text-[#737373]">{invoiceData.date}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 4. DARK MODE / OBSIDIAN LAYOUT
export function DarkPdfLayout(props: PdfLayoutProps) {
  const {
    invoiceData,
    activeProfile,
    lineItems,
    currency,
    language,
    t,
    subtotal,
    discountRate,
    discountAmount,
    kdvAmount,
    total,
    formatCurrency,
    getFutureDate,
  } = props;

  const docTitle =
    invoiceData.title?.trim() ||
    (invoiceData.billingType === "subscription"
      ? t.subscriptionDocumentTitle
      : t.documentTitle);

  return (
    <div className="flex w-full flex-1 flex-col justify-start text-[#f5f4ef]">
      {/* Centered Title with Dark Theme Accents */}
      <div className="mb-10 mt-4 text-center">
        <h1 lang="en" className="mb-2 text-2xl font-bold uppercase tracking-widest text-white">
          {docTitle}
        </h1>
        <div className="flex items-center justify-center gap-2 font-mono text-sm text-[#a8a7a0]">
          <span>{invoiceData.date}</span>
          {invoiceData.billingType === "subscription" && (
            <>
              <span>•</span>
              <span className="font-semibold text-[#dff568]">
                {invoiceData.billingCycle === "monthly"
                  ? t.cycleMonthlyBadge
                  : invoiceData.billingCycle === "quarterly"
                  ? t.cycleQuarterlyBadge
                  : t.cycleYearlyBadge}
              </span>
            </>
          )}
        </div>

        {/* Due Date & Subscription Badges */}
        {invoiceData.showDueDate && invoiceData.dueDate && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#1f211c] px-3 py-1 text-[11px] font-medium text-[#d5d4ce]">
            <CalendarClock className="size-3 text-[#dff568]" />
            <span>
              {t.dueDatePrefix}: {invoiceData.dueDate}
            </span>
          </div>
        )}

        {invoiceData.billingType === "subscription" &&
          (invoiceData.periodStart || invoiceData.periodEnd) && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1f211c] px-4 py-1.5 text-xs font-medium text-white">
              <span className="size-1.5 rounded-full bg-[#dff568]" />
              <span>
                {t.billingPeriodLabel}: {invoiceData.periodStart || invoiceData.date} –{" "}
                {invoiceData.periodEnd || getFutureDate(12)}
              </span>
              {invoiceData.autoRenewal && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#dff568]">
                  {t.autoRenewalLabel}
                </span>
              )}
            </div>
          )}
      </div>

      {/* Client Info Card */}
      <div className="mb-10 rounded-2xl border border-white/8 bg-[#1a1c17] p-5 text-center">
        <h3 lang="en" className="mb-1 text-xs font-bold uppercase tracking-wider text-[#9e9d96]">
          {t.clientHeader}
        </h3>
        <p className="text-2xl font-bold text-white">{invoiceData.clientName}</p>
      </div>

      {/* Table */}
      <div className="flex-1">
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr lang="en" className="border-b border-white/20 font-bold uppercase text-[#dff568]">
              <th className="w-1/2 py-3 text-left font-bold">{t.thService}</th>
              <th className="w-1/6 py-3 text-center font-bold">{t.thQuantity}</th>
              <th className="w-1/6 py-3 text-right font-bold">{t.thPrice}</th>
              <th className="w-1/6 py-3 text-right font-bold">{t.thTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#85847e]">
                  {t.noServicesAdded}
                </td>
              </tr>
            ) : (
              lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="wrap-break-word py-4 pr-3 align-middle">
                    <span className="font-medium text-[#f5f4ef]">{item.name || t.unnamedService}</span>
                    {item.description && (
                      <span className="mt-1 block text-xs font-normal leading-5 text-[#9e9d96]">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-center font-mono align-middle text-[#d5d4ce]">{item.quantity}</td>
                  <td className="font-geist py-4 text-right tabular-nums align-middle text-[#d5d4ce]">
                    {formatCurrency(Number(item.price) || 0, currency)}
                  </td>
                  <td className="font-geist py-4 text-right font-bold tabular-nums text-white align-middle">
                    {formatCurrency(
                      (Number(item.quantity) || 0) * (Number(item.price) || 0),
                      currency
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals Box */}
        <div className="mt-8 flex justify-end">
          <div className="flex w-1/2 flex-col gap-1.5 rounded-xl border border-white/8 bg-[#1a1c17] p-4 text-sm">
            {(invoiceData.kdvRate > 0 || (invoiceData.showDiscount && discountRate > 0)) && (
              <div className="flex justify-between py-1 text-[#9e9d96]">
                <span className="font-medium">{t.subtotalLabel}</span>
                <span className="font-geist tabular-nums text-[#f5f4ef]">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
            )}
            {invoiceData.showDiscount && discountRate > 0 && (
              <div className="flex justify-between py-1 text-[#ff7070]">
                <span className="font-medium">
                  {t.discountBadgeLabel} (%{discountRate})
                </span>
                <span className="font-geist font-medium tabular-nums">
                  -{formatCurrency(discountAmount, currency)}
                </span>
              </div>
            )}
            {invoiceData.kdvRate > 0 && (
              <div className="flex justify-between py-1 text-[#9e9d96]">
                <span className="font-medium">
                  {!invoiceData.taxId ||
                  invoiceData.taxId.startsWith("tax-") ||
                  invoiceData.taxName === "KDV" ||
                  invoiceData.taxName === "VAT" ||
                  invoiceData.taxName === "VAT / Tax"
                    ? t.kdvTaxLabel
                    : invoiceData.taxName}{" "}
                  (%{invoiceData.kdvRate})
                </span>
                <span className="font-geist tabular-nums text-[#f5f4ef]">
                  {formatCurrency(kdvAmount, currency)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
              <span className="text-lg font-bold uppercase tracking-tight text-white">
                {t.totalLabel}
              </span>
              <div className="text-right">
                <span className="font-geist text-2xl font-bold tabular-nums text-[#dff568]">
                  {formatCurrency(total, currency)}
                </span>
                {invoiceData.billingType === "subscription" && (
                  <span className="font-geist ml-1.5 text-sm font-semibold text-[#a8a7a0]">
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

        {/* Bank & Payment Information Card */}
        {invoiceData.showPaymentInfo &&
          (invoiceData.bankName || invoiceData.iban || invoiceData.accountHolder) && (
            <div className="mt-6 rounded-xl border border-white/8 bg-[#1a1c17] p-3.5 text-xs text-[#d5d4ce]">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                <Building2 className="size-3 text-[#dff568]" />
                {t.paymentInfoTitle}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {invoiceData.bankName && (
                  <div>
                    <span className="font-medium text-[#85847e]">{t.bankNameLabel}: </span>
                    <span className="font-medium text-white">{invoiceData.bankName}</span>
                  </div>
                )}
                {invoiceData.accountHolder && (
                  <div>
                    <span className="font-medium text-[#85847e]">{t.accountHolderLabel}: </span>
                    <span className="font-medium text-white">{invoiceData.accountHolder}</span>
                  </div>
                )}
                {invoiceData.iban && (
                  <div className="col-span-full font-mono text-[11px]">
                    <span className="font-sans font-medium text-[#85847e]">{t.ibanLabel}: </span>
                    <span className="font-semibold text-[#dff568]">{invoiceData.iban}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Notes & Terms on PDF */}
        {invoiceData.showNotes !== false && invoiceData.notes && (
          <div className="mt-4 rounded-xl border border-white/8 bg-[#1a1c17] p-4 text-xs text-[#9e9d96]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {language === "tr" ? "Notlar ve Şartlar" : "Notes & Terms"}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-[#d5d4ce]">{invoiceData.notes}</p>
          </div>
        )}

        {/* Signature & Stamp Area on PDF */}
        {invoiceData.showSignature && (
          <div className="mt-8 flex justify-end">
            <div className="w-56 border-t border-white/20 pt-2 text-center">
              <p className="text-xs font-semibold text-white">
                {invoiceData.signatureTitle || t.signatureLineText}
              </p>
              <p className="mt-0.5 text-[9px] text-[#85847e]">{invoiceData.date}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer (Logo & Freelancer Info) */}
      <div className="mt-auto flex flex-col items-center gap-4 pt-12 text-center">
        {activeProfile.logoBase64 && (
          <Image
            src={activeProfile.logoBase64}
            alt="Company Logo"
            width={200}
            height={64}
            className="max-w-50 h-16 w-auto object-contain brightness-110"
          />
        )}
        <div className="flex flex-col">
          <p className="text-lg font-bold text-white">{activeProfile.companyName}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#9e9d96]">{activeProfile.contactInfo}</p>
        </div>
      </div>
    </div>
  );
}

// Master Layout Renderer Dispatcher
export function PdfDocumentRenderer(props: PdfLayoutProps) {
  const layout = props.invoiceData.pdfLayout || "modern";

  switch (layout) {
    case "corporate":
      return <CorporatePdfLayout {...props} />;
    case "creative":
      return <CreativePdfLayout {...props} />;
    case "dark":
      return <DarkPdfLayout {...props} />;
    case "modern":
    default:
      return <ModernPdfLayout {...props} />;
  }
}
