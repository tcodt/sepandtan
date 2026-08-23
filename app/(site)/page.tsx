"use client";

import AboutFeature from "@/components/common/about-feature";
import HeroSection from "@/components/common/hero-section";
import Plans from "@/components/common/plans";
import Services from "@/components/common/services";
import Usage from "@/components/common/usage";
import UserResult from "@/components/common/user-result";
import DomeGallery from "@/components/DomeGallery";
import { useEffect } from "react";

export function HashScroll() {
  useEffect(() => {
    if (window.location.hash === "#plans") {
      const el = document.getElementById("plans");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return null;
}

export default function Home() {
  return (
    <div>
      <HeroSection />
      <HashScroll />
      <Services />
      <Usage />
      <AboutFeature />
      <div className="w-full h-[80vh] mb-12 pb-12">
        <h3 className="md:text-2xl text-xl text-center md:text-start text-foreground font-semibold p-4 md:p-8">
          ورزشکاران هفته
        </h3>
        <DomeGallery grayscale={false} />
      </div>
      <Plans />
      <UserResult />
    </div>
  );
}
