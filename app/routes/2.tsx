import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/2")({
  component: LandingSwissGrid,
});

/**
 * Design 2 — "Swiss / International Typographic Style"
 * Clean white bg, strict grid, red accent, mathematical precision.
 * Inspired by Josef Müller-Brockmann. Information-first. No decoration.
 */
export default function LandingSwissGrid() {
  return (
    <div
      className="min-h-screen bg-white text-[#111] selection:bg-red-600 selection:text-white"
      style={{ fontFamily: "Geist, Helvetica Neue, Helvetica, Arial, sans-serif" }}
    >
      {/* Nav — razor thin */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#111] px-8 py-3 flex justify-between items-center">
        <span className="text-sm font-bold tracking-[0.25em] uppercase">{PRODUCT_NAME}</span>
        <div className="flex gap-6 items-center text-xs tracking-[0.2em] uppercase font-medium">
          <Link to="/sign-in" className="hover:text-red-600 transition-colors">
            <Trans comment="Nav: log in">Log in</Trans>
          </Link>
          <Link
            to="/sign-up"
            className="bg-red-600 text-white px-4 py-1.5 hover:bg-red-700 transition-colors"
          >
            <Trans comment="Nav: start">Start</Trans>
          </Link>
        </div>
      </nav>

      {/* Hero — grid-based, asymmetric */}
      <section className="border-b border-[#111]">
        <div className="max-w-7xl mx-auto grid grid-cols-12 min-h-[80vh]">
          {/* Left column — large type */}
          <div className="col-span-12 md:col-span-7 px-8 py-16 flex flex-col justify-end border-r border-[#111]">
            <div className="text-[11px] tracking-[0.4em] uppercase text-[#999] mb-8">
              <Trans comment="Swiss hero label">Video Review Platform</Trans>
            </div>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight">
              {PRODUCT_NAME}
            </h1>
            <div className="w-16 h-1 bg-red-600 mt-8" />
          </div>

          {/* Right column — data */}
          <div className="col-span-12 md:col-span-5 flex flex-col">
            <div className="flex-1 px-8 py-16 flex flex-col justify-end">
              <p className="text-lg leading-relaxed text-[#555] max-w-sm">
                <Trans comment="Swiss hero description">
                  Frame-accurate video review for creative teams.
                  Unlimited seats. Flat pricing. No complexity.
                </Trans>
              </p>
              <div className="mt-8 flex gap-4">
                <Link
                  to="/sign-up"
                  className="bg-red-600 text-white px-8 py-3 text-sm font-bold tracking-[0.15em] uppercase hover:bg-red-700 transition-colors"
                >
                  <Trans comment="CTA">Start Free Trial</Trans>
                </Link>
              </div>
            </div>
            <div className="border-t border-[#111] px-8 py-6">
              <div className="text-[11px] tracking-[0.3em] uppercase text-[#999]">
                <Trans comment="Price label">Starting at</Trans>
              </div>
              <div className="text-4xl font-black mt-1">
                $5<span className="text-lg font-normal text-[#999]">/mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid — strict 4-column */}
      <section className="border-b border-[#111]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { num: "01", title: "Self-hosted", desc: "Your servers, your data" },
            { num: "02", title: "Fast", desc: "0.3s average response" },
            { num: "03", title: "Flat pricing", desc: "$5/mo for everyone" },
            { num: "04", title: "Simple sharing", desc: "Copy link, send" },
          ].map((f, i) => (
            <div
              key={f.num}
              className={`p-8 ${i < 3 ? "border-r border-[#111]" : ""} ${i < 2 ? "border-b md:border-b-0 border-[#111]" : ""}`}
            >
              <div className="text-[11px] tracking-[0.3em] text-red-600 font-medium mb-6">
                {f.num}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-[#999] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — 3-column */}
      <section className="border-b border-[#111] px-8 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 mb-16">
            <div className="col-span-12 md:col-span-4">
              <div className="text-[11px] tracking-[0.4em] uppercase text-[#999] mb-3">
                <Trans comment="Section label">Process</Trans>
              </div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                <Trans comment="How it works heading">How it works</Trans>
              </h2>
              <div className="w-12 h-1 bg-red-600 mt-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { step: "1", title: "Upload", desc: "Drag your video. We process it in seconds." },
              { step: "2", title: "Share", desc: "Send a link. No account needed for reviewers." },
              { step: "3", title: "Review", desc: "Click on any frame to leave a comment." },
            ].map((s) => (
              <div key={s.step}>
                <div className="text-6xl font-black text-[#eee] mb-4">{s.step}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-[#999] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison — tabular, data-driven */}
      <section className="border-b border-[#111] px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-[11px] tracking-[0.4em] uppercase text-[#999] mb-3">
            <Trans comment="Comparison section label">Comparison</Trans>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-12">
            <Trans comment="Comparison heading">{PRODUCT_NAME} vs Frame.io</Trans>
          </h2>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-[#111]">
                <th className="py-4 text-[11px] tracking-[0.3em] uppercase text-[#999] font-medium w-1/3">
                  <Trans comment="Feature column">Feature</Trans>
                </th>
                <th className="py-4 text-[11px] tracking-[0.3em] uppercase text-[#999] font-medium w-1/3">
                  Frame.io
                </th>
                <th className="py-4 text-[11px] tracking-[0.3em] uppercase text-red-600 font-medium w-1/3">
                  {PRODUCT_NAME}
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { feature: "Price (5 users)", them: "$1,140/yr", us: "$60/yr" },
                { feature: "Seats", them: "Per-seat", us: "Unlimited" },
                { feature: "Self-hosting", them: "No", us: "Yes" },
                { feature: "Interface", them: "Complex", us: "Minimal" },
                { feature: "Setup time", them: "Hours", us: "Minutes" },
              ].map((row) => (
                <tr key={row.feature} className="border-b border-[#eee]">
                  <td className="py-4 font-medium">{row.feature}</td>
                  <td className="py-4 text-[#999]">{row.them}</td>
                  <td className="py-4 font-bold">{row.us}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 p-6 bg-[#f8f8f8]">
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#999]">
              <Trans comment="Savings">Annual savings (5 users)</Trans>
            </span>
            <span className="text-3xl font-black text-red-600 ml-4">$1,080</span>
          </div>
        </div>
      </section>

      {/* Pricing — minimal cards */}
      <section id="pricing" className="border-b border-[#111] px-8 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-[11px] tracking-[0.4em] uppercase text-[#999] mb-3">
            <Trans comment="Pricing label">Plans</Trans>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-12">
            <Trans comment="Pricing heading">Pricing</Trans>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#111]">
            {/* Basic */}
            <div className="bg-white p-10">
              <div className="text-[11px] tracking-[0.3em] uppercase text-[#999] mb-4">
                <Trans comment="Basic tier">Basic</Trans>
              </div>
              <div className="text-5xl font-black mb-1">$5</div>
              <div className="text-sm text-[#999] mb-8">
                <Trans comment="Per month">per month</Trans>
              </div>
              <ul className="space-y-3 text-sm mb-10">
                <li className="flex gap-2"><span className="text-red-600">—</span> Unlimited seats</li>
                <li className="flex gap-2"><span className="text-red-600">—</span> Unlimited projects</li>
                <li className="flex gap-2"><span className="text-red-600">—</span> 100GB storage</li>
                <li className="flex gap-2"><span className="text-red-600">—</span> NLE export</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center border-2 border-[#111] py-3 text-sm font-bold tracking-[0.15em] uppercase hover:bg-[#111] hover:text-white transition-all"
              >
                <Trans comment="Get Basic">Get Basic</Trans>
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-white p-10">
              <div className="text-[11px] tracking-[0.3em] uppercase text-red-600 mb-4">
                <Trans comment="Pro tier">Pro</Trans>
              </div>
              <div className="text-5xl font-black mb-1">$25</div>
              <div className="text-sm text-[#999] mb-8">
                <Trans comment="Per month">per month</Trans>
              </div>
              <ul className="space-y-3 text-sm mb-10">
                <li className="flex gap-2"><span className="text-red-600">—</span> Everything in Basic</li>
                <li className="flex gap-2"><span className="text-red-600">—</span> 1TB storage</li>
                <li className="flex gap-2"><span className="text-red-600">—</span> Priority support</li>
                <li className="flex gap-2"><span className="text-red-600">—</span> Custom branding</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center bg-red-600 text-white py-3 text-sm font-bold tracking-[0.15em] uppercase hover:bg-red-700 transition-colors"
              >
                <Trans comment="Get Pro">Get Pro</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-32">
        <div className="max-w-5xl mx-auto grid grid-cols-12">
          <div className="col-span-12 md:col-span-8">
            <h2 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tight">
              <Trans comment="Final CTA">
                Start
                <br />
                reviewing.
              </Trans>
            </h2>
            <div className="w-16 h-1 bg-red-600 mt-8 mb-8" />
            <Link
              to="/sign-up"
              className="inline-block bg-red-600 text-white px-10 py-4 text-sm font-bold tracking-[0.15em] uppercase hover:bg-red-700 transition-colors"
            >
              <Trans comment="Create team">Create Your Team</Trans>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#111] px-8 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-sm font-bold tracking-[0.25em] uppercase">{PRODUCT_NAME}</span>
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#999]">
            <Trans comment="Footer">Video review for creative teams</Trans>
          </span>
        </div>
      </footer>
    </div>
  );
}
