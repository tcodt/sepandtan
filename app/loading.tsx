import Image from "next/image";

export default function Loading() {
  return (
    <div
      className="relative flex h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden bg-background"
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری"
    >
      {/* Ambient radial glow — brand-tinted, breathing */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-105 w-105 rounded-full opacity-40 blur-3xl motion-reduce:hidden"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, currentColor 25%, transparent) 0%, transparent 70%)",
          animation: "logoGlow 2.8s ease-in-out infinite",
        }}
      />

      {/* Logo wrapper */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Rotating conic ring */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full motion-reduce:animate-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, currentColor 60%, transparent) 90deg, transparent 180deg, color-mix(in oklab, currentColor 60%, transparent) 270deg, transparent 360deg)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            animation: "logoSpin 2.4s linear infinite",
          }}
        />

        {/* Soft track behind the ring */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border border-foreground/10"
        />

        {/* Logo image with spring pulse + shimmer sweep */}
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-background/60 backdrop-blur-sm">
          <Image
            src="/images/logo-light.jpg"
            alt=""
            width={64}
            height={64}
            priority
            className="h-full w-full object-cover motion-reduce:animate-none rounded-full"
            style={{
              animation: "logoPulse 1.6s ease-in-out infinite",
            }}
          />

          {/* Shimmer sweep — subtle light pass */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-reduce:hidden"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, color-mix(in oklab, white 45%, transparent) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "logoShimmer 2.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Caption */}
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-foreground/80">
          در حال آماده‌سازی…
        </p>
        <p className="text-xs text-foreground/50">لحظه‌ای صبر کنید</p>
      </div>

      {/* Keyframes — scoped, no external CSS file needed */}
      <style>{`
        @keyframes logoSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(0.92); }
        }
        @keyframes logoGlow {
          0%, 100% { transform: scale(0.9); opacity: 0.35; }
          50%      { transform: scale(1.05); opacity: 0.55; }
        }
        @keyframes logoShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
