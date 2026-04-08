import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/1")({
  component: LandingDarkCinema,
});

/**
 * Design 1 — "Dark Cinema"
 * Pure black bg, cinematic grain, dramatic oversized type, red accent.
 */
export default function LandingDarkCinema() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navOpaque = scrollY > 80;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      {/* Film grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Nav */}
      <nav
        className={`fixed top-0 w-full z-50 px-8 py-5 flex justify-between items-center transition-all duration-300 ${navOpaque ? "bg-black/90 backdrop-blur-md border-b border-white/10" : ""}`}
      >
        <span className="text-lg font-bold tracking-[0.2em] uppercase">
          {PRODUCT_NAME}
        </span>
        <div className="flex gap-8 items-center text-sm tracking-widest uppercase">
          <a href="#features" className="opacity-60 hover:opacity-100 transition-opacity">
            <Trans comment="Nav: features">Features</Trans>
          </a>
          <a href="#pricing" className="opacity-60 hover:opacity-100 transition-opacity">
            <Trans comment="Nav: pricing">Pricing</Trans>
          </a>
          <Link to="/sign-in" className="opacity-60 hover:opacity-100 transition-opacity">
            <Trans comment="Nav: log in">Log in</Trans>
          </Link>
          <Link
            to="/sign-up"
            className="bg-red-600 text-white px-5 py-2 hover:bg-red-500 transition-colors"
          >
            <Trans comment="Nav: start CTA">Start</Trans>
          </Link>
        </div>
      </nav>

      {/* Hero — full viewport, centered massive title */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08)_0%,transparent_70%)]" />

        <div className="relative z-10 text-center max-w-5xl">
          <h1
            className="text-[18vw] md:text-[14vw] font-black leading-[0.8] tracking-tighter"
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
          >
            {PRODUCT_NAME}
          </h1>

          <div className="mt-12 flex flex-col items-center gap-6">
            <p className="text-xl md:text-2xl text-white/50 font-light tracking-wide max-w-lg">
              <Trans comment="Cinema hero tagline">
                Video review for creative teams. Brutally simple.
              </Trans>
            </p>

            <div className="flex gap-4 mt-4">
              <Link
                to="/sign-up"
                className="bg-red-600 text-white px-10 py-4 text-lg font-bold tracking-wider uppercase hover:bg-red-500 transition-colors"
              >
                <Trans comment="Hero CTA">Start Free</Trans>
              </Link>
              <a
                href="#features"
                className="border border-white/20 px-10 py-4 text-lg font-bold tracking-wider uppercase text-white/60 hover:text-white hover:border-white/40 transition-all"
              >
                <Trans comment="Hero secondary CTA">Learn More</Trans>
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12 bg-white animate-pulse" />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: "$5", label: "per month" },
            { value: "∞", label: "seats" },
            { value: "0.3s", label: "response" },
            { value: "100%", label: "your data" },
          ].map((s, i) => (
            <div
              key={i}
              className={`py-10 px-8 text-center ${i < 3 ? "border-r border-white/10" : ""}`}
            >
              <div className="text-4xl md:text-5xl font-black text-red-500">{s.value}</div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40 mt-2">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-32">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-20">
            <Trans comment="Features heading">
              Everything you need.
              <br />
              <span className="text-red-600">Nothing you don't.</span>
            </Trans>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {[
              {
                num: "01",
                title: "Frame-accurate comments",
                desc: "Click on the exact frame. Leave your note. Done.",
              },
              {
                num: "02",
                title: "Instant sharing",
                desc: "Copy the link. Send it. No account needed for reviewers.",
              },
              {
                num: "03",
                title: "Self-hosted",
                desc: "Your servers. Your data. Full control over the pipeline.",
              },
              {
                num: "04",
                title: "Export to any NLE",
                desc: "Comments export to Premiere, Resolve, Final Cut. No lock-in.",
              },
            ].map((f) => (
              <div
                key={f.num}
                className="bg-black p-12 group hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-red-600/50 text-sm font-mono tracking-widest">
                  {f.num}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold mt-4 mb-3 group-hover:text-red-500 transition-colors">
                  {f.title}
                </h3>
                <p className="text-white/40 text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison — dramatic split */}
      <section className="border-y border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
          {/* Them */}
          <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-white/10">
            <div className="text-xs tracking-[0.3em] text-white/30 uppercase mb-6">
              <Trans comment="Competitor label">The other guys</Trans>
            </div>
            <div className="text-4xl font-black mb-2">Frame.io</div>
            <div className="text-5xl font-black text-white/20 mb-8">$19<span className="text-lg">/user/mo</span></div>
            <ul className="space-y-4 text-white/40">
              <li className="flex gap-3"><span className="text-red-500">✕</span> Per-seat pricing</li>
              <li className="flex gap-3"><span className="text-red-500">✕</span> Complex interface</li>
              <li className="flex gap-3"><span className="text-red-500">✕</span> No self-hosting</li>
              <li className="flex gap-3"><span className="text-red-500">✕</span> Enterprise bloat</li>
            </ul>
          </div>
          {/* Us */}
          <div className="p-12 md:p-16 bg-red-600/5">
            <div className="text-xs tracking-[0.3em] text-red-500 uppercase mb-6">
              <Trans comment="Our product label">The solution</Trans>
            </div>
            <div className="text-4xl font-black mb-2">{PRODUCT_NAME}</div>
            <div className="text-5xl font-black text-red-500 mb-8">$5<span className="text-lg">/mo total</span></div>
            <ul className="space-y-4">
              <li className="flex gap-3"><span className="text-red-500">✓</span> Unlimited seats</li>
              <li className="flex gap-3"><span className="text-red-500">✓</span> Dead simple</li>
              <li className="flex gap-3"><span className="text-red-500">✓</span> Self-hosted option</li>
              <li className="flex gap-3"><span className="text-red-500">✓</span> Just what you need</li>
            </ul>
            <div className="mt-10 pt-6 border-t border-white/10">
              <span className="text-xs tracking-[0.3em] text-white/30 uppercase">
                <Trans comment="Savings label">Yearly savings (5 users)</Trans>
              </span>
              <div className="text-3xl font-black text-red-500 mt-1">$1,080</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-16">
            <Trans comment="Pricing heading">Pricing.</Trans>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic */}
            <div className="border border-white/10 p-10 text-left hover:border-white/20 transition-colors">
              <div className="text-xs tracking-[0.3em] text-white/30 uppercase mb-4">
                <Trans comment="Basic tier">Basic</Trans>
              </div>
              <div className="text-5xl font-black mb-2">
                $5<span className="text-xl text-white/30">/mo</span>
              </div>
              <p className="text-white/40 mb-8">
                <Trans comment="Basic desc">100GB storage. Unlimited everything else.</Trans>
              </p>
              <ul className="space-y-3 text-white/60 mb-10">
                <li>✓ Unlimited seats</li>
                <li>✓ Unlimited projects</li>
                <li>✓ Frame-accurate comments</li>
                <li>✓ NLE export</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center border border-white/20 py-4 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all"
              >
                <Trans comment="Get Basic CTA">Get Basic</Trans>
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-red-600 p-10 text-left relative">
              <div className="absolute -top-3 right-6 bg-red-600 text-xs font-bold px-3 py-1 uppercase tracking-wider">
                <Trans comment="Popular badge">Popular</Trans>
              </div>
              <div className="text-xs tracking-[0.3em] text-red-500 uppercase mb-4">
                <Trans comment="Pro tier">Pro</Trans>
              </div>
              <div className="text-5xl font-black mb-2">
                $25<span className="text-xl text-white/30">/mo</span>
              </div>
              <p className="text-white/40 mb-8">
                <Trans comment="Pro desc">1TB storage. Same features, more space.</Trans>
              </p>
              <ul className="space-y-3 text-white/60 mb-10">
                <li>✓ Everything in Basic</li>
                <li>✓ 1TB storage</li>
                <li>✓ Priority support</li>
                <li>✓ Custom branding</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center bg-red-600 py-4 font-bold uppercase tracking-wider hover:bg-red-500 transition-colors"
              >
                <Trans comment="Get Pro CTA">Get Pro</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-8 py-40 text-center">
        <h2 className="text-7xl md:text-[10vw] font-black tracking-tighter leading-[0.8] mb-8">
          <Trans comment="Final CTA">
            START
            <br />
            <span className="text-red-600">NOW.</span>
          </Trans>
        </h2>
        <Link
          to="/sign-up"
          className="inline-block bg-red-600 text-white px-16 py-6 text-xl font-bold tracking-wider uppercase hover:bg-red-500 transition-colors"
        >
          <Trans comment="Create team CTA">Create Your Team</Trans>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xl font-black tracking-[0.15em]">{PRODUCT_NAME}</span>
          <span className="text-xs text-white/30 tracking-widest uppercase">
            <Trans comment="Footer tagline">Video review for creative teams</Trans>
          </span>
        </div>
      </footer>
    </div>
  );
}
