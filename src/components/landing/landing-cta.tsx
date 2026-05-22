"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/scroll-reveal";

export function LandingCta() {
  return (
    <section className="bg-[#f9fafb] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white px-8 py-16 md:px-16 md:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-emerald-500/10 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tighter text-zinc-950 md:text-4xl">
                Ready to sign in to your portal?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                Students, lecturers, administrators, and parents each get a
                tailored dashboard. Sign in with your account to get started.
              </p>
              <Button
                size="lg"
                className="mt-8 h-12 rounded-full bg-emerald-700 px-8 text-white hover:bg-emerald-800 active:scale-[0.98]"
                asChild
              >
                <Link href="/login">
                  Continue to sign in
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
