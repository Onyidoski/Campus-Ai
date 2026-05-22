"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
      className="sticky top-0 z-40 border-b border-slate-200/60 bg-[#f9fafb]/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Campus AI"
            width={36}
            height={36}
            className="object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-zinc-950">
            Campus AI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "Platform", href: "#platform" },
            { label: "Impact", href: "#impact" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-emerald-700 text-white shadow-[0_8px_24px_-8px_rgba(4,120,87,0.45)] hover:bg-emerald-800 active:scale-[0.98]"
            asChild
          >
            <Link href="/login">
              Get started
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
