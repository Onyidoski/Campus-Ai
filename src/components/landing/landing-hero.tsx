"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Bot, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#f9fafb]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="mx-auto grid min-h-[100dvh] max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start lg:pr-6"
        >
          <motion.h1
            variants={item}
            className="max-w-[14ch] text-4xl font-semibold tracking-tighter text-zinc-950 leading-none md:text-6xl"
          >
            One campus.
            <span className="mt-2 block text-emerald-800">Smarter learning.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-[65ch] text-base leading-relaxed text-zinc-600"
          >
            Campus AI unifies your LMS, RAG-powered academic chatbot, study
            companion, online classes, and offline materials — so students and
            lecturers stop chasing updates across WhatsApp, email, and notice boards.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              size="lg"
              className="h-12 rounded-full bg-zinc-950 px-8 text-white hover:bg-zinc-800 active:scale-[0.98]"
              asChild
            >
              <Link href="/login">
                Open your portal
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-slate-200 bg-white active:scale-[0.98]"
              asChild
            >
              <a href="#platform">See how it works</a>
            </Button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-12 flex flex-col gap-4 border-t border-slate-200/80 pt-8 sm:flex-row sm:gap-10"
          >
            {[
              { icon: Bot, label: "RAG chatbot on your course docs" },
              { icon: BookOpen, label: "Quizzes & flashcards from uploads" },
              { icon: WifiOff, label: "PWA offline for spotty networks" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-zinc-600">
                <Icon className="size-4 shrink-0 text-emerald-700" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ type: "spring", stiffness: 90, damping: 22, delay: 0.1 }}
          className="relative lg:-mr-4"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] sm:aspect-[5/6] lg:aspect-auto lg:min-h-[520px]">
            <Image
              src="/hero-campus-ai.png"
              alt="Students and lecturers collaborating with laptops on campus"
              fill
              className="object-cover object-[center_20%]"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Live this week
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                CSC 401 — 3 assignments due · 2 unread forum threads
              </p>
              <p className="mt-2 font-mono text-xs text-emerald-200/90">
                47 students active in the last 24h
              </p>
            </div>
          </div>

          <motion.div
            aria-hidden
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-12 hidden rounded-2xl border border-slate-200/60 bg-white px-4 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.12)] lg:block"
          >
            <p className="text-xs text-zinc-500">Avg. response time</p>
            <p className="font-mono text-lg font-semibold tracking-tight text-zinc-950">
              1.4s
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
