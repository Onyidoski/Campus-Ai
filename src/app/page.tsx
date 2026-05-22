import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingBento } from "@/components/landing/landing-bento";
import {
  LandingFeatures,
  LandingImpact,
} from "@/components/landing/landing-features";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[#f9fafb] font-sans">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingBento />
        <LandingFeatures />
        <LandingImpact />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
