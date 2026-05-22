"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { scrollViewport } from "@/components/landing/scroll-reveal";

const footerSpring = { type: "spring" as const, stiffness: 90, damping: 22 };

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Platform", href: "#platform" },
  { label: "Impact", href: "#impact" },
];

const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/login" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={scrollViewport}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
          }}
          className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr] lg:gap-16"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: footerSpring },
            }}
            className="flex flex-col gap-5"
          >
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Campus AI"
                width={40}
                height={40}
                className="object-contain brightness-0 invert"
              />
              <span className="text-base font-semibold tracking-tight text-white">
                Campus AI
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
              AI-powered campus assistant with integrated learning — LMS, RAG
              chatbot, study companion, online classes, and offline access in one
              place.
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: footerSpring },
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Product
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: footerSpring },
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Account
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ ...scrollViewport, amount: 0.2 }}
          transition={footerSpring}
          className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-zinc-500">
            {new Date().getFullYear()} Campus AI. All rights reserved.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            Next.js · Supabase · Gemini RAG
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
