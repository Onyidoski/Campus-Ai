"use client";

import Image from "next/image";
import {
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Video,
} from "lucide-react";
import {
  Reveal,
  RevealItem,
  RevealStagger,
  slideFromLeft,
  slideFromRight,
  fadeUp,
} from "@/components/landing/scroll-reveal";

const features = [
  {
    id: "lms",
    icon: LayoutDashboard,
    title: "Learning management that stays in sync",
    body: "Lecturers upload PDFs, slides, and videos once. Students see assignments, deadlines, and grades without digging through group chats.",
    image: "https://picsum.photos/seed/campus-lms/900/640",
    imageSide: "right" as const,
  },
  {
    id: "chat",
    icon: MessagesSquare,
    title: "Academic chatbot grounded in your materials",
    body: "Ask questions in natural language. Answers pull from vector-indexed course documents via Gemini and RAG — not random web guesses.",
    image: "https://picsum.photos/seed/campus-rag/900/640",
    imageSide: "left" as const,
  },
  {
    id: "class",
    icon: Video,
    title: "Online classes and forums, same login",
    body: "Schedule Jitsi sessions inside the app. Each course gets a discussion board so questions and answers stay with the module.",
    image: "https://picsum.photos/seed/campus-class/900/640",
    imageSide: "right" as const,
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-20 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-800">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-zinc-950 md:text-4xl">
              Built for how universities actually run
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-zinc-600">
            One cohesive PWA for courses, AI study tools, and campus communication
            — not another generic template.
          </p>
        </Reveal>

        <div className="flex flex-col gap-24 md:gap-32">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const imageFirst = feature.imageSide === "left";
            const imageVariant = imageFirst ? slideFromLeft : slideFromRight;
            const textVariant = imageFirst ? slideFromRight : slideFromLeft;

            return (
              <article
                key={feature.id}
                className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Reveal
                  variant={imageVariant}
                  className={`relative aspect-[16/11] overflow-hidden rounded-[2rem] border border-slate-200/50 bg-slate-100 ${
                    imageFirst ? "lg:order-1" : "lg:order-2"
                  }`}
                  style={{ marginTop: index === 1 ? "-1rem" : undefined }}
                >
                  <Image
                    src={feature.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </Reveal>

                <Reveal
                  variant={textVariant}
                  className={`flex flex-col items-start ${
                    imageFirst ? "lg:order-2 lg:pl-4" : "lg:order-1 lg:pr-8"
                  }`}
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-slate-200/80 bg-[#f9fafb] text-emerald-800">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-zinc-600">
                    {feature.body}
                  </p>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingImpact() {
  return (
    <section
      id="impact"
      className="border-y border-slate-200/80 bg-zinc-950 py-20 text-white md:py-28"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
        <Reveal variant={fadeUp}>
          <div className="mb-6 inline-flex items-center gap-2 text-emerald-400/90">
            <GraduationCap className="size-5" strokeWidth={1.75} />
            <span className="text-sm font-medium uppercase tracking-wider">
              Why Campus AI
            </span>
          </div>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tighter md:text-5xl md:leading-none">
            Intelligent campus tech that scales with your institution.
          </h2>
          <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-zinc-400">
            Evaluated through structured usability studies with students and
            lecturers — measuring engagement, satisfaction, and real coursework
            workflows before wider rollout.
          </p>
        </Reveal>

        <RevealStagger className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          {[
            { label: "Target respondents", value: "225+" },
            { label: "User roles", value: "4" },
            { label: "Core modules", value: "7" },
            { label: "Offline-ready", value: "PWA" },
          ].map((stat) => (
            <RevealItem key={stat.label}>
              <dt className="text-xs uppercase tracking-wider text-zinc-500">
                {stat.label}
              </dt>
              <dd className="mt-2 font-mono text-3xl font-semibold tracking-tight text-white">
                {stat.value}
              </dd>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
