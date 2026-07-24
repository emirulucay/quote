"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  CloudOff,
  Coffee,
  FileDown,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { QuoteLogo } from "@/components/quote-logo";

const GithubIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2.23c-3.23.7-3.91-1.37-3.91-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.19 1.78 1.19 1.03 1.78 2.72 1.26 3.38.97.1-.75.4-1.26.74-1.56-2.58-.3-5.3-1.3-5.3-5.75 0-1.27.45-2.3 1.2-3.12-.13-.3-.52-1.48.1-3.08 0 0 .98-.31 3.2 1.2a11.1 11.1 0 0 1 5.83 0c2.22-1.51 3.19-1.2 3.19-1.2.63 1.6.24 2.79.12 3.08.74.81 1.19 1.85 1.19 3.12 0 4.47-2.72 5.45-5.31 5.74.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const features = [
  { icon: Zap, eyebrow: "Fast by default", title: "From blank page to PDF in under a minute", description: "A focused workflow with live totals, sensible defaults and zero setup." },
  { icon: FileDown, eyebrow: "Made to send", title: "Sharp, client-ready A4 documents", description: "Every export is designed to look polished on screen, in print and in an inbox." },
  { icon: Globe2, eyebrow: "Work globally", title: "Language, currency and tax flexibility", description: "Switch between Turkish and English, four currencies and your own tax rules." },
  { icon: ShieldCheck, eyebrow: "Private by design", title: "Your business data stays yours", description: "Profiles and client details remain in your browser. No account, no server, no tracking." },
];

const faqs = [
  ["Is Quote really free?", "Yes. Quote is completely free and open-source, with no plans, usage limits or hidden export fees."],
  ["Do I need to create an account?", "No. Open the generator and start immediately. Your company profiles and preferences are saved locally in your browser."],
  ["Can I use my own logo and tax rate?", "Yes. Add your company logo, save multiple profiles and create custom taxes such as KDV, GST, VAT or withholding tax."],
  ["Where is my information stored?", "Your quote, profile and client information stays in local browser storage and is never sent to our servers."],
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div lang="en" className="min-h-screen overflow-x-hidden bg-[#f5f3ee] text-[#161714] selection:bg-[#f2ff54] selection:text-[#161714]">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-black/8 bg-[#f5f3ee]/88 px-4 shadow-[0_8px_40px_rgba(20,21,18,0.07)] backdrop-blur-xl sm:h-16 sm:px-6">
          <Link href="/" aria-label="Quote home" className="flex items-center transition-opacity hover:opacity-65">
            <QuoteLogo className="h-6 w-auto sm:h-7" />
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-black/55 md:flex">
            <a href="#product" className="transition-colors hover:text-black">Product</a>
            <a href="#features" className="transition-colors hover:text-black">Features</a>
            <a href="#faq" className="transition-colors hover:text-black">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://github.com/emirulucay/quote" target="_blank" rel="noreferrer" aria-label="View Quote on GitHub" className="hidden size-10 items-center justify-center rounded-full border border-black/10 bg-white/50 transition-colors hover:bg-white sm:flex">
              <GithubIcon />
            </a>
            <Link href="/app" className="group inline-flex h-10 items-center gap-2 rounded-full bg-[#171815] px-4 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02] sm:px-5">
              Open app <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:pb-32">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(218,255,88,0.38)_0%,rgba(245,243,238,0)_68%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/65 shadow-sm">
                <Sparkles className="size-3.5 text-[#789000]" /> No signup. No subscription. Just quotes.
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }} className="text-balance text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.91] tracking-[-0.065em]">
                Make a great first impression.
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.14 }} className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-black/58 sm:text-xl sm:leading-8">
                Create polished quotes and invoices in seconds—then export a crisp PDF your clients will take seriously.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.22 }} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/app" className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#171815] px-7 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(23,24,21,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(23,24,21,0.25)] sm:w-auto">
                  Create your first quote <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#product" className="inline-flex h-14 w-full items-center justify-center rounded-full border border-black/12 bg-white/45 px-7 text-sm font-semibold transition-colors hover:bg-white sm:w-auto">See how it works</a>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-black/45">
                {['100% free', 'No account required', 'Data stays in your browser'].map((label) => <span key={label} className="flex items-center gap-1.5"><Check className="size-3.5 text-[#6f8500]" />{label}</span>)}
              </motion.div>
            </div>

            <motion.div id="product" initial={{ opacity: 0, y: 34, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.75, delay: 0.28, ease: "easeOut" }} className="relative mx-auto mt-14 max-w-6xl scroll-mt-28 sm:mt-20">
              <div className="absolute -inset-10 -z-10 rounded-[4rem] bg-[#dff568]/25 blur-3xl" />
              <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#20211e] p-1.5 shadow-[0_40px_100px_rgba(20,21,18,0.24)] sm:rounded-[2rem] sm:p-2">
                <div className="flex h-11 items-center justify-between px-3 text-white/45 sm:px-5">
                  <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" /></div>
                  <span className="font-mono text-[9px] tracking-wide sm:text-[11px]">quote.emirulucay.com/app</span><span className="w-12" />
                </div>
                <div className="grid min-h-[520px] overflow-hidden rounded-[1.15rem] bg-[#eeece6] lg:grid-cols-[0.74fr_1.26fr]">
                  <div className="border-b border-black/8 p-5 sm:p-8 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">Quote details</p><span className="rounded-full bg-[#dff568] px-2.5 py-1 text-[10px] font-bold">LIVE</span></div>
                    <div className="mt-7 space-y-5">
                      {[['Client', 'Northstar Studio'], ['Project', 'Website design & development'], ['Valid until', '24 August 2026']].map(([label, value]) => <div key={label}><p className="mb-2 text-[11px] font-medium text-black/42">{label}</p><div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium shadow-sm">{value}</div></div>)}
                      <div className="grid grid-cols-2 gap-3"><div><p className="mb-2 text-[11px] font-medium text-black/42">Currency</p><div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium">EUR · €</div></div><div><p className="mb-2 text-[11px] font-medium text-black/42">Tax</p><div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium">VAT · 20%</div></div></div>
                    </div>
                    <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#171815] py-3.5 text-xs font-semibold text-white"><FileDown className="size-4" /> Download PDF</div>
                  </div>
                  <div className="flex items-center justify-center p-4 sm:p-9 lg:p-12">
                    <div className="aspect-[1/1.414] w-full max-w-[500px] bg-white p-[7%] shadow-[0_20px_50px_rgba(20,21,18,0.14)]">
                      <div className="flex items-start justify-between border-b-2 border-black pb-[7%]"><div><p className="text-[clamp(12px,2vw,22px)] font-semibold tracking-[-0.03em]">QUOTE</p><p className="mt-1 font-mono text-[7px] text-black/40 sm:text-[9px]">Q-2026-042</p></div><div className="text-right"><p className="text-[8px] font-semibold sm:text-xs">NOVA WORKS</p><p className="mt-1 text-[6px] text-black/40 sm:text-[9px]">design@novaworks.co</p></div></div>
                      <div className="py-[8%]"><p className="text-[6px] font-semibold uppercase tracking-widest text-black/35 sm:text-[8px]">Prepared for</p><p className="mt-1 text-[10px] font-semibold sm:text-sm">Northstar Studio</p></div>
                      <div className="grid grid-cols-[1fr_auto] border-b border-black pb-2 text-[6px] font-semibold uppercase tracking-wider sm:text-[8px]"><span>Service</span><span>Total</span></div>
                      {[['Product strategy & UX', '€1,800'], ['Visual design system', '€2,400'], ['Frontend development', '€3,200']].map(([service, total]) => <div key={service} className="grid grid-cols-[1fr_auto] border-b border-black/8 py-[5%] text-[7px] sm:text-[10px]"><span>{service}</span><span className="font-mono font-medium">{total}</span></div>)}
                      <div className="ml-auto mt-[7%] w-[58%] space-y-2 text-[7px] sm:text-[10px]"><div className="flex justify-between text-black/45"><span>Subtotal</span><span className="font-mono">€7,400</span></div><div className="flex justify-between text-black/45"><span>VAT 20%</span><span className="font-mono">€1,480</span></div><div className="flex justify-between border-t border-black pt-3 text-[10px] font-semibold sm:text-sm"><span>Total</span><span className="font-mono">€8,880</span></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-2 top-[28%] hidden rounded-2xl border border-black/8 bg-white p-4 shadow-xl sm:flex sm:items-center sm:gap-3 lg:-right-10"><div className="flex size-9 items-center justify-center rounded-full bg-[#dff568]"><CircleCheck className="size-4" /></div><div><p className="text-xs font-semibold">Ready to send</p><p className="mt-0.5 text-[10px] text-black/45">PDF exported successfully</p></div></div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-black/8 bg-[#171815] px-4 py-8 text-white sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-5 text-xs font-medium text-white/62 sm:justify-between">
            <span className="text-white/35">BUILT FOR INDEPENDENT WORK</span>{['Freelancers', 'Studios', 'Consultants', 'Small teams'].map((item) => <span key={item} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#dff568]" />{item}</span>)}
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div {...fadeUp} className="grid gap-7 border-b border-black/10 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/42">Less admin. More momentum.</p>
              <h2 className="text-balance text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-6xl">Everything you need.<br /><span className="text-black/35">Nothing you don’t.</span></h2>
            </motion.div>
            <div className="grid md:grid-cols-2">
              {features.map((feature, index) => { const Icon = feature.icon; return <motion.article key={feature.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.06 }} className={`group border-black/10 py-10 md:p-10 ${index % 2 === 0 ? 'md:border-r' : ''} ${index < 2 ? 'border-b' : index === 2 ? 'border-b md:border-b-0' : ''}`}><div className="mb-14 flex items-center justify-between"><div className="flex size-11 items-center justify-center rounded-full border border-black/10 bg-white transition-colors group-hover:bg-[#dff568]"><Icon className="size-4.5" /></div><span className="font-mono text-[10px] text-black/30">0{index + 1}</span></div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">{feature.eyebrow}</p><h3 className="mt-3 max-w-md text-2xl font-medium leading-tight tracking-[-0.03em] sm:text-3xl">{feature.title}</h3><p className="mt-4 max-w-md text-sm leading-6 text-black/50 sm:text-base">{feature.description}</p></motion.article>; })}
            </div>
          </div>
        </section>

        <section className="bg-[#dff568] px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div {...fadeUp}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">How it works</p><h2 className="mt-5 text-5xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-7xl">Three steps.<br />One polished PDF.</h2><p className="mt-6 max-w-md text-base leading-7 text-black/55">The fastest path from project scope to a document ready for your client.</p><Link href="/app" className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#171815] px-6 py-3.5 text-sm font-semibold text-white">Start creating <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></motion.div>
            <div className="space-y-3">{[[Layers3, 'Add the essentials', 'Client details, services, prices and your own brand.'], [Zap, 'See it come together', 'Your document updates instantly as you work.'], [FileDown, 'Export and send', 'Download a clean A4 PDF with one click.']].map(([Icon, title, copy], index) => { const StepIcon = Icon as typeof Layers3; return <motion.div key={title as string} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.08 }} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-black/10 bg-[#ecff83]/70 p-5 sm:p-6"><div className="flex size-11 items-center justify-center rounded-full bg-[#171815] text-white"><StepIcon className="size-4.5" /></div><div><h3 className="font-semibold">{title as string}</h3><p className="mt-1 text-sm text-black/50">{copy as string}</p></div><span className="font-mono text-xs text-black/35">0{index + 1}</span></motion.div>; })}</div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 sm:py-32"><div className="mx-auto grid max-w-7xl gap-12 rounded-[2rem] bg-white p-7 shadow-[0_20px_70px_rgba(20,21,18,0.07)] sm:p-12 lg:grid-cols-2 lg:gap-20 lg:p-16"><motion.div {...fadeUp}><div className="flex size-12 items-center justify-center rounded-full bg-[#f5f3ee]"><CloudOff className="size-5" /></div><h2 className="mt-8 text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">Private means<br />private.</h2><p className="mt-5 max-w-md leading-7 text-black/50">Your financial data never leaves your device. Quote works without an account and stores your information locally in your browser.</p></motion.div><motion.div {...fadeUp} className="grid content-center gap-3">{['No server-side database', 'No account or personal profile', 'No client-data tracking', 'Clear your data whenever you want'].map((item) => <div key={item} className="flex items-center gap-3 border-b border-black/8 py-4 text-sm font-medium"><span className="flex size-6 items-center justify-center rounded-full bg-[#dff568]"><Check className="size-3.5" /></span>{item}</div>)}</motion.div></div></section>

        <section id="faq" className="scroll-mt-24 border-t border-black/8 px-4 py-24 sm:px-6 sm:py-32"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr]"><motion.div {...fadeUp}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">Questions, answered</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Good to know.</h2></motion.div><div>{faqs.map(([question, answer], index) => { const open = activeFaq === index; return <div key={question} className="border-b border-black/12"><button type="button" onClick={() => setActiveFaq(open ? null : index)} className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-semibold sm:text-lg" aria-expanded={open}><span>{question}</span><span className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-black/10 transition-all ${open ? 'rotate-180 bg-[#dff568]' : 'bg-white'}`}><ChevronDown className="size-4" /></span></button><AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"><p className="max-w-2xl pb-7 pr-10 text-sm leading-6 text-black/50 sm:text-base sm:leading-7">{answer}</p></motion.div>}</AnimatePresence></div>; })}</div></div></section>

        <section className="px-4 pb-4 sm:px-6 sm:pb-6"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#171815] px-6 py-20 text-center text-white sm:px-12 sm:py-28"><div className="absolute left-1/2 top-[-8rem] h-80 w-3/5 -translate-x-1/2 rounded-full bg-[#dff568]/16 blur-[110px]" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#dff568]">Your next quote starts here</p><h2 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-medium leading-[1.02] tracking-[-0.05em] !text-white sm:text-7xl">Look professional before the project even begins.</h2><Link href="/app" className="group mt-9 inline-flex h-14 items-center gap-3 rounded-full bg-[#dff568] px-7 text-sm font-semibold text-black shadow-[0_12px_35px_rgba(223,245,104,0.18)] transition-all hover:scale-[1.03] hover:bg-[#e8ff72]">Create a quote—it’s free <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div></div></section>
      </main>

      <footer className="px-4 py-10 sm:px-6"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-xs text-black/45 sm:flex-row"><div className="flex items-center gap-3"><QuoteLogo className="h-5 w-auto" /><span>© {new Date().getFullYear()} Quote</span></div><div className="flex flex-wrap items-center justify-center gap-5"><span>Free & open-source</span><a href="https://github.com/emirulucay/quote" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-black"><GithubIcon className="size-3.5" /> GitHub</a><a href="https://buymeacoffee.com/emirulucay" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-black"><Coffee className="size-3.5" /> Buy me a coffee</a></div></div></footer>
    </div>
  );
}
