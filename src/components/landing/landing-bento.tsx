"use client";

import { memo, useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import {
  Reveal,
  RevealItem,
  RevealStagger,
} from "@/components/landing/scroll-reveal";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

function IntelligentListCard() {
  const items = [
    { id: "a", title: "Submit HCI prototype", course: "CSC 312", priority: 1 },
    { id: "b", title: "Read Chapter 7 — RAG", course: "CSC 401", priority: 2 },
    { id: "c", title: "Forum reply: DB indexing", course: "CSC 305", priority: 3 },
  ];
  const [order, setOrder] = useState(items);

  useEffect(() => {
    const id = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) next.unshift(last);
        return next;
      });
    }, 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <BentoCardShell minHeight="min-h-[240px]">
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {order.map((item) => (
            <motion.div
              key={item.id}
              layout="position"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.course}</p>
              </div>
              <span className="font-mono text-xs text-emerald-700">P{item.priority}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </BentoCardShell>
  );
}

const PROMPTS = [
  "Summarise my Operating Systems notes for mid-semester…",
  "What assignments are due in CSC 401 this week?",
  "Generate 10 flashcards from the uploaded PDF…",
] as const;

const CommandInputCard = memo(function CommandInputCard() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const full = PROMPTS[index];
    if (typing) {
      if (text.length < full.length) {
        const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 36);
        return () => clearTimeout(t);
      }
      const pause = setTimeout(() => setTyping(false), 1400);
      return () => clearTimeout(pause);
    }
    const erase = setTimeout(() => {
      if (text.length > 0) setText(text.slice(0, -1));
      else {
        setIndex((i) => (i + 1) % PROMPTS.length);
        setTyping(true);
      }
    }, 24);
    return () => clearTimeout(erase);
  }, [text, typing, index]);

  return (
    <BentoCardShell minHeight="min-h-[200px]" className="justify-center">
      <div className="rounded-2xl border border-slate-200/80 bg-[#f9fafb] px-4 py-3">
        <p className="text-sm text-zinc-700">
          {text}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-emerald-700"
          />
        </p>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full w-[40%] bg-gradient-to-r from-emerald-600/20 via-emerald-600/60 to-emerald-600/20"
          animate={{ x: ["-100%", "250%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </BentoCardShell>
  );
});

function LiveStatusCard() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const show = () => {
      setShowAlert(true);
      return setTimeout(() => setShowAlert(false), 3000);
    };
    let hideTimer = show();
    const id = setInterval(() => {
      clearTimeout(hideTimer);
      hideTimer = show();
    }, 7000);
    return () => {
      clearInterval(id);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <BentoCardShell minHeight="min-h-[200px]">
      <div className="space-y-4">
        {[
          { time: "09:00", label: "CSC 401 — Online class", live: true },
          { time: "14:30", label: "Office hours — Dr. Okonkwo", live: false },
        ].map((slot) => (
          <div key={slot.time} className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">{slot.time}</span>
            <span className="text-sm text-zinc-800">{slot.label}</span>
            {slot.live && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/50" />
                <span className="relative size-2 rounded-full bg-emerald-600" />
              </span>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
          >
            Class starting in 12 min
          </motion.div>
        )}
      </AnimatePresence>
    </BentoCardShell>
  );
}

const metrics = [
  { label: "Materials synced", value: "128" },
  { label: "Forum posts", value: "1.2k" },
  { label: "Quiz sets", value: "84" },
  { label: "Offline saves", value: "312" },
];

function DataStreamCard() {
  return (
    <BentoCardShell minHeight="min-h-[120px]" className="overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex w-max gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          {[...metrics, ...metrics].map((m, i) => (
            <div
              key={`${m.label}-${i}`}
              className="w-[140px] shrink-0 rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3"
            >
              <p className="font-mono text-xl font-semibold tracking-tight text-zinc-950">
                {m.value}
              </p>
              <p className="text-xs text-zinc-500">{m.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </BentoCardShell>
  );
}

function FocusDocumentCard() {
  return (
    <BentoCardShell minHeight="min-h-[200px]">
      <p className="text-sm leading-relaxed text-zinc-600">
        Retrieval-Augmented Generation grounds every answer in{" "}
        <motion.span
          className="rounded bg-emerald-100/80 px-1 text-zinc-900"
          initial={{ backgroundColor: "transparent" }}
          animate={{
            backgroundColor: [
              "transparent",
              "rgb(209 250 229 / 0.8)",
              "rgb(209 250 229 / 0.8)",
            ],
          }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          your uploaded lecture notes
        </motion.span>
        , not generic web text — so revision stays course-accurate.
      </p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, ...spring }}
        className="mt-6 flex gap-2"
      >
        {[Sparkles, FileText].map((Icon, i) => (
          <div
            key={i}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200/80 bg-[#f9fafb] text-emerald-800"
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </div>
        ))}
      </motion.div>
    </BentoCardShell>
  );
}

function BentoCardShell({
  children,
  className = "",
  minHeight = "",
}: {
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={`relative isolate flex flex-col rounded-[2.5rem] border border-slate-200/50 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ${minHeight} ${className}`}
    >
      {children}
    </div>
  );
}

const bentoMeta = [
  { title: "Priority queue", desc: "Deadlines surface automatically from your courses." },
  { title: "Ask in plain language", desc: "Natural prompts across chatbot and study tools." },
  { title: "Live timetable", desc: "Classes and alerts without leaving the app." },
  { title: "Department pulse", desc: "Organic usage metrics from real activity." },
  { title: "Grounded answers", desc: "RAG ties responses to materials you trust." },
];

function BentoCell({
  Card,
  title,
  desc,
  className = "",
}: {
  Card: ComponentType;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <RevealItem className={`flex min-w-0 flex-col ${className}`}>
      <Card />
      <div className="relative z-0 mt-5 shrink-0">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="mt-1 text-sm text-zinc-500">{desc}</p>
      </div>
    </RevealItem>
  );
}

export function LandingBento() {
  return (
    <section id="platform" className="bg-[#f9fafb] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 max-w-2xl md:mb-20">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-800">
            Platform
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-zinc-950 md:text-5xl md:leading-none">
            Everything academic,
            <span className="block text-zinc-500">orchestrated in one surface.</span>
          </h2>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 gap-x-5 gap-y-14 md:grid-cols-3">
          <BentoCell Card={IntelligentListCard} {...bentoMeta[0]} />
          <BentoCell Card={CommandInputCard} {...bentoMeta[1]} />
          <BentoCell Card={LiveStatusCard} {...bentoMeta[2]} />
        </RevealStagger>

        <RevealStagger className="mt-14 grid grid-cols-1 gap-x-5 gap-y-14 md:mt-16 md:grid-cols-3">
          <BentoCell
            Card={DataStreamCard}
            {...bentoMeta[3]}
            className="md:col-span-2"
          />
          <BentoCell Card={FocusDocumentCard} {...bentoMeta[4]} />
        </RevealStagger>
      </div>
    </section>
  );
}
