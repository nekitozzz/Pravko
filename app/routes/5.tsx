import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/5")({
  component: LandingSoftModern,
});

/**
 * Design 5 — "Soft Modern / Gradient"
 * Bold gradients (purple → blue), large rounded corners, soft shadows,
 * glassmorphism cards, pill buttons. Playful SaaS aesthetic.
 */
export default function LandingSoftModern() {
  return (
    <div
      className="min-h-screen bg-[#fafafe] text-[#1e1b4b] selection:bg-violet-500 selection:text-white"
      style={{ fontFamily: "Geist, system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-violet-100 px-8 py-4 flex justify-between items-center">
        <span className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
          {PRODUCT_NAME}
        </span>
        <div className="flex gap-6 items-center text-sm">
          <a href="#pricing" className="text-slate-500 hover:text-violet-600 transition-colors font-medium">
            <Trans comment="Nav: pricing">Pricing</Trans>
          </a>
          <Link to="/sign-in" className="text-slate-500 hover:text-violet-600 transition-colors font-medium">
            <Trans comment="Nav: log in">Log in</Trans>
          </Link>
          <Link
            to="/sign-up"
            className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:-translate-y-0.5"
          >
            <Trans comment="Nav: start">Get Started</Trans>
          </Link>
        </div>
      </nav>

      {/* Hero — gradient bg with floating cards */}
      <section className="relative px-8 pt-20 pb-32 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300/15 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 text-sm text-violet-700 font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <Trans comment="Hero badge">New: Self-hosted video review</Trans>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight">
            <Trans comment="Gradient hero title">
              Video review
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                made simple.
              </span>
            </Trans>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mt-8 max-w-2xl mx-auto leading-relaxed">
            <Trans comment="Hero subtitle">
              Frame-accurate comments, unlimited seats, and flat pricing.
              The video review tool creative teams have been waiting for.
            </Trans>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/sign-up"
              className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-violet-500/25 transition-all hover:-translate-y-0.5"
            >
              <Trans comment="Hero CTA">Start Free Trial</Trans>
            </Link>
            <a
              href="#features"
              className="bg-white border border-slate-200 px-10 py-4 rounded-full text-lg font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-600 transition-all"
            >
              <Trans comment="Hero secondary">See Features</Trans>
            </a>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-4 justify-center mt-16">
            {[
              { label: "$5/mo flat", icon: "💰" },
              { label: "Unlimited seats", icon: "👥" },
              { label: "0.3s response", icon: "⚡" },
              { label: "Self-hosted", icon: "🔒" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
              >
                <span className="mr-2">{s.icon}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — bento grid */}
      <section id="features" className="px-8 py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-violet-600 mb-2">
              <Trans comment="Features label">Features</Trans>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <Trans comment="Features heading">Everything you need to review</Trans>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Frame-accurate",
                desc: "Click on the exact frame. Leave your note. Done. No more guessing timestamps.",
                gradient: "from-violet-500 to-purple-600",
              },
              {
                icon: "🔗",
                title: "Instant sharing",
                desc: "Send a link. No account needed for reviewers. Zero friction for clients.",
                gradient: "from-blue-500 to-cyan-600",
              },
              {
                icon: "🏠",
                title: "Self-hosted",
                desc: "Your servers. Your data. Full control over the entire video pipeline.",
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                icon: "🎬",
                title: "Any NLE export",
                desc: "Export comments to Premiere Pro, DaVinci Resolve, and Final Cut Pro.",
                gradient: "from-orange-500 to-amber-600",
              },
              {
                icon: "⚡",
                title: "Blazing fast",
                desc: "0.3s average response. Built for speed from the ground up.",
                gradient: "from-pink-500 to-rose-600",
              },
              {
                icon: "♾️",
                title: "Unlimited seats",
                desc: "Invite the whole team. One flat price. No per-seat surprises.",
                gradient: "from-indigo-500 to-violet-600",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group bg-[#fafafe] rounded-2xl p-8 border border-slate-200 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-violet-600 mb-2">
              <Trans comment="Process label">Process</Trans>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <Trans comment="Process heading">Three steps to better reviews</Trans>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload",
                desc: "Drag and drop your video. Processing takes seconds.",
                gradient: "from-violet-600 to-blue-600",
              },
              {
                step: "2",
                title: "Share",
                desc: "Copy the link. Send it to your team or client. No sign-up needed.",
                gradient: "from-blue-600 to-cyan-600",
              },
              {
                step: "3",
                title: "Review",
                desc: "Click on any frame to comment. Export notes to your NLE.",
                gradient: "from-cyan-600 to-emerald-600",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-2xl font-extrabold mb-6 shadow-lg shadow-violet-500/20`}
                >
                  {s.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison — gradient cards */}
      <section className="px-8 py-24 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-violet-600 mb-2">
              <Trans comment="Compare label">Compare</Trans>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <Trans comment="Compare heading">Why teams switch</Trans>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Them */}
            <div className="rounded-2xl border border-slate-200 p-8 bg-slate-50">
              <div className="text-sm font-semibold text-slate-400 mb-4">Frame.io</div>
              <div className="text-4xl font-extrabold text-slate-400 mb-6">
                $19<span className="text-lg font-normal">/user/mo</span>
              </div>
              <ul className="space-y-3 text-slate-400">
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs">✕</span>
                  Per-seat pricing
                </li>
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs">✕</span>
                  Complex interface
                </li>
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs">✕</span>
                  No self-hosting
                </li>
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs">✕</span>
                  Enterprise bloat
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-sm text-slate-400">Team of 5 annually</div>
                <div className="text-2xl font-bold text-slate-400">$1,140</div>
              </div>
            </div>

            {/* Us */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 p-8 text-white shadow-xl shadow-violet-500/20">
              <div className="text-sm font-semibold text-violet-200 mb-4">{PRODUCT_NAME}</div>
              <div className="text-4xl font-extrabold mb-6">
                $5<span className="text-lg font-normal text-violet-200">/mo total</span>
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  Unlimited seats
                </li>
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  Dead simple
                </li>
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  Self-hosted option
                </li>
                <li className="flex gap-3 items-center">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  Just what you need
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-sm text-violet-200">
                  <Trans comment="Savings">You save annually</Trans>
                </div>
                <div className="text-3xl font-extrabold">$1,080</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-semibold text-violet-600 mb-2">
              <Trans comment="Pricing label">Pricing</Trans>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <Trans comment="Pricing heading">Simple pricing for everyone</Trans>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Basic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
              <div className="text-sm font-semibold text-slate-400 mb-4">
                <Trans comment="Basic tier">Basic</Trans>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold">$5</span>
                <span className="text-slate-400 mb-1.5">/mo</span>
              </div>
              <p className="text-slate-500 mb-8">
                <Trans comment="Basic desc">100GB storage. Everything unlimited.</Trans>
              </p>
              <ul className="space-y-3 text-sm mb-10">
                <li className="flex gap-2 items-center"><span className="text-violet-500">✓</span> Unlimited seats</li>
                <li className="flex gap-2 items-center"><span className="text-violet-500">✓</span> Unlimited projects</li>
                <li className="flex gap-2 items-center"><span className="text-violet-500">✓</span> Frame-accurate comments</li>
                <li className="flex gap-2 items-center"><span className="text-violet-500">✓</span> NLE export</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center border-2 border-slate-200 py-3.5 rounded-full font-semibold text-slate-700 hover:border-violet-500 hover:text-violet-600 transition-all"
              >
                <Trans comment="Get Basic">Get Basic</Trans>
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 p-8 text-white shadow-xl shadow-violet-500/20 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                <Trans comment="Popular badge">MOST POPULAR</Trans>
              </div>
              <div className="text-sm font-semibold text-violet-200 mb-4">
                <Trans comment="Pro tier">Pro</Trans>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold">$25</span>
                <span className="text-violet-200 mb-1.5">/mo</span>
              </div>
              <p className="text-violet-200 mb-8">
                <Trans comment="Pro desc">1TB storage. Same simplicity, more space.</Trans>
              </p>
              <ul className="space-y-3 text-sm mb-10">
                <li className="flex gap-2 items-center"><span>✓</span> Everything in Basic</li>
                <li className="flex gap-2 items-center"><span>✓</span> 1TB storage</li>
                <li className="flex gap-2 items-center"><span>✓</span> Priority support</li>
                <li className="flex gap-2 items-center"><span>✓</span> Custom branding</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center bg-white text-violet-600 py-3.5 rounded-full font-bold hover:bg-violet-50 transition-colors"
              >
                <Trans comment="Get Pro">Get Pro</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            <Trans comment="Final CTA">
              Ready to start
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                reviewing?
              </span>
            </Trans>
          </h2>
          <p className="text-lg text-slate-500 mt-6 mb-10">
            <Trans comment="CTA subtext">Free trial. No credit card required.</Trans>
          </p>
          <Link
            to="/sign-up"
            className="inline-block bg-gradient-to-r from-violet-600 to-blue-600 text-white px-12 py-5 rounded-full text-lg font-bold hover:shadow-xl hover:shadow-violet-500/25 transition-all hover:-translate-y-0.5"
          >
            <Trans comment="Create team">Create Your Team</Trans>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-8 py-8 bg-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-lg font-extrabold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
            {PRODUCT_NAME}
          </span>
          <span className="text-sm text-slate-400">
            <Trans comment="Footer tagline">Video review for creative teams.</Trans>
          </span>
        </div>
      </footer>
    </div>
  );
}
