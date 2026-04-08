import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/3")({
  component: LandingEditorial,
});

/**
 * Design 3 — "Editorial / Magazine"
 * Asymmetric layout, Instrument Serif headings, pull quotes,
 * warm cream background, indigo/navy accent. Feels like a feature article.
 */
export default function LandingEditorial() {
  return (
    <div
      className="min-h-screen bg-[#faf8f4] text-[#1c1917] selection:bg-indigo-600 selection:text-white"
      style={{ fontFamily: "Geist, Georgia, serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e5e0d8] px-8 py-4 flex justify-between items-center">
        <span
          className="text-2xl tracking-tight"
          style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
        >
          {PRODUCT_NAME}
        </span>
        <div className="flex gap-6 items-center text-sm">
          <a href="#pricing" className="text-[#78716c] hover:text-[#1c1917] transition-colors">
            <Trans comment="Nav: pricing">Pricing</Trans>
          </a>
          <Link to="/sign-in" className="text-[#78716c] hover:text-[#1c1917] transition-colors">
            <Trans comment="Nav: sign in">Sign in</Trans>
          </Link>
          <Link
            to="/sign-up"
            className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Trans comment="Nav: start">Get Started</Trans>
          </Link>
        </div>
      </nav>

      {/* Hero — editorial spread */}
      <section className="px-8 py-20 md:py-32">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8 items-end">
          {/* Left — oversized heading */}
          <div className="col-span-12 md:col-span-8">
            <div className="text-xs tracking-[0.3em] uppercase text-indigo-600 font-medium mb-6">
              <Trans comment="Editorial kicker">Video Review, Reimagined</Trans>
            </div>
            <h1
              className="text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              <Trans comment="Editorial hero title">
                The tool creative
                <br />
                teams actually
                <br />
                <em className="text-indigo-600">wanted.</em>
              </Trans>
            </h1>
          </div>

          {/* Right — byline and intro */}
          <div className="col-span-12 md:col-span-4">
            <div className="border-l-2 border-indigo-600 pl-6">
              <p className="text-lg leading-relaxed text-[#57534e]">
                <Trans comment="Editorial intro paragraph">
                  Frame-accurate comments. Unlimited seats. $5/month flat.
                  Built for teams who ship creative work, not manage enterprise software.
                </Trans>
              </p>
              <Link
                to="/sign-up"
                className="inline-block mt-6 text-indigo-600 font-semibold underline underline-offset-4 decoration-2 hover:text-indigo-800 transition-colors"
              >
                <Trans comment="Read more CTA">Start your free trial →</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-8">
        <div className="border-t border-[#e5e0d8]" />
      </div>

      {/* Feature article — asymmetric two-column */}
      <section className="px-8 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-12">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-4 order-2 md:order-1">
            <div className="sticky top-24 space-y-10">
              {/* Quick facts */}
              <div>
                <div className="text-xs tracking-[0.3em] uppercase text-[#a8a29e] mb-4">
                  <Trans comment="Quick facts label">Quick Facts</Trans>
                </div>
                {[
                  { label: "Price", value: "$5/mo" },
                  { label: "Seats", value: "Unlimited" },
                  { label: "Storage", value: "100GB+" },
                  { label: "Setup", value: "5 minutes" },
                ].map((fact) => (
                  <div key={fact.label} className="flex justify-between py-3 border-b border-[#e5e0d8] text-sm">
                    <span className="text-[#78716c]">{fact.label}</span>
                    <span className="font-semibold">{fact.value}</span>
                  </div>
                ))}
              </div>

              {/* Pull quote */}
              <blockquote className="relative">
                <div
                  className="text-6xl text-indigo-600/20 leading-none absolute -top-4 -left-2"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
                >
                  "
                </div>
                <p
                  className="text-xl leading-snug pt-6 pl-4"
                  style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
                >
                  <Trans comment="Pull quote">
                    I built {PRODUCT_NAME} because video review should be instant.
                  </Trans>
                </p>
                <cite className="block text-sm text-[#78716c] mt-3 pl-4 not-italic">— Theo</cite>
              </blockquote>
            </div>
          </div>

          {/* Main content */}
          <div className="col-span-12 md:col-span-8 order-1 md:order-2">
            {/* Section: The Problem */}
            <div className="mb-16">
              <h2
                className="text-3xl md:text-4xl mb-6"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                <Trans comment="Problem heading">The problem with video review</Trans>
              </h2>
              <div className="prose prose-lg text-[#57534e] leading-relaxed space-y-4">
                <p>
                  <Trans comment="Problem paragraph 1">
                    Creative teams spend hours wrestling with bloated review tools.
                    Per-seat pricing punishes growth. Complex interfaces slow down feedback.
                    Enterprise features no one asked for get in the way of the one thing that matters:
                    getting notes on your cut.
                  </Trans>
                </p>
                <p>
                  <Trans comment="Problem paragraph 2">
                    Frame.io charges $19 per user per month. For a team of five,
                    that's over a thousand dollars a year — for software that takes
                    longer to load than your timeline.
                  </Trans>
                </p>
              </div>
            </div>

            {/* Section: The Solution */}
            <div className="mb-16">
              <h2
                className="text-3xl md:text-4xl mb-6"
                style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
              >
                <Trans comment="Solution heading">A simpler approach</Trans>
              </h2>
              <div className="prose prose-lg text-[#57534e] leading-relaxed space-y-4">
                <p>
                  <Trans comment="Solution paragraph">
                    {PRODUCT_NAME} strips video review down to what matters.
                    Upload your video. Share a link. Click on any frame to leave a comment.
                    Export your notes to Premiere, Resolve, or Final Cut.
                    That's it.
                  </Trans>
                </p>
              </div>
            </div>

            {/* Feature cards — stacked */}
            <div className="space-y-6">
              {[
                {
                  title: "Frame-accurate comments",
                  desc: "Click anywhere on the video timeline. Your comment lands on the exact frame — not 'somewhere around 2:34'.",
                },
                {
                  title: "No account needed for reviewers",
                  desc: "Send a link. Your client watches, comments, and moves on. Zero friction.",
                },
                {
                  title: "Self-hosted option",
                  desc: "Keep everything on your own servers. Your data never leaves your infrastructure.",
                },
                {
                  title: "Any NLE export",
                  desc: "Comments export to markers in Premiere Pro, DaVinci Resolve, and Final Cut Pro.",
                },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-lg p-8 border border-[#e5e0d8]">
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-[#78716c] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison — editorial table */}
      <section className="bg-[#1c1917] text-[#faf8f4] px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs tracking-[0.3em] uppercase text-indigo-400 mb-3">
            <Trans comment="Comparison label">Side by Side</Trans>
          </div>
          <h2
            className="text-4xl md:text-5xl mb-12"
            style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
          >
            <Trans comment="Comparison heading">How we compare</Trans>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="text-sm text-[#a8a29e] mb-4">Frame.io</div>
              <div className="text-4xl font-bold mb-2">$19<span className="text-lg text-[#a8a29e]">/user/mo</span></div>
              <ul className="space-y-3 text-[#a8a29e] mt-6">
                <li>• Per-seat pricing</li>
                <li>• Complex interface</li>
                <li>• Adobe lock-in</li>
                <li>• No self-hosting</li>
              </ul>
            </div>
            <div>
              <div className="text-sm text-indigo-400 mb-4">{PRODUCT_NAME}</div>
              <div className="text-4xl font-bold text-indigo-400 mb-2">$5<span className="text-lg text-[#a8a29e]">/mo total</span></div>
              <ul className="space-y-3 mt-6">
                <li>• Unlimited seats</li>
                <li>• Minimal & fast</li>
                <li>• Works with any NLE</li>
                <li>• Self-hosted option</li>
              </ul>
              <div className="mt-8 pt-6 border-t border-[#333]">
                <div className="text-sm text-[#a8a29e]">
                  <Trans comment="Savings label">Annual savings (5 users)</Trans>
                </div>
                <div className="text-3xl font-bold text-indigo-400 mt-1">$1,080</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs tracking-[0.3em] uppercase text-indigo-600 mb-3">
              <Trans comment="Pricing label">Pricing</Trans>
            </div>
            <h2
              className="text-4xl md:text-5xl"
              style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
            >
              <Trans comment="Pricing heading">Simple, honest pricing</Trans>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Basic */}
            <div className="bg-white rounded-lg border border-[#e5e0d8] p-8">
              <div className="text-sm text-[#a8a29e] font-medium mb-4">
                <Trans comment="Basic tier">Basic</Trans>
              </div>
              <div className="text-4xl font-bold mb-1">$5<span className="text-lg text-[#a8a29e] font-normal">/mo</span></div>
              <p className="text-sm text-[#78716c] mb-6">
                <Trans comment="Basic desc">100GB storage. Everything unlimited.</Trans>
              </p>
              <ul className="space-y-2 text-sm mb-8">
                <li>✓ Unlimited seats & projects</li>
                <li>✓ Frame-accurate comments</li>
                <li>✓ NLE export</li>
                <li>✓ Share links</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center border-2 border-[#1c1917] py-3 rounded-full font-medium hover:bg-[#1c1917] hover:text-white transition-all"
              >
                <Trans comment="Get Basic">Get Basic</Trans>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-indigo-600 text-white rounded-lg p-8">
              <div className="text-sm text-indigo-200 font-medium mb-4">
                <Trans comment="Pro tier">Pro</Trans>
              </div>
              <div className="text-4xl font-bold mb-1">$25<span className="text-lg text-indigo-200 font-normal">/mo</span></div>
              <p className="text-sm text-indigo-200 mb-6">
                <Trans comment="Pro desc">1TB storage. Same simplicity, more space.</Trans>
              </p>
              <ul className="space-y-2 text-sm mb-8">
                <li>✓ Everything in Basic</li>
                <li>✓ 1TB storage</li>
                <li>✓ Priority support</li>
                <li>✓ Custom branding</li>
              </ul>
              <Link
                to="/sign-up"
                className="block text-center bg-white text-indigo-600 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors"
              >
                <Trans comment="Get Pro">Get Pro</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center">
        <h2
          className="text-5xl md:text-7xl leading-tight"
          style={{ fontFamily: "Instrument Serif, Georgia, serif" }}
        >
          <Trans comment="Final CTA">
            Ready to simplify
            <br />
            your <em className="text-indigo-600">review process?</em>
          </Trans>
        </h2>
        <Link
          to="/sign-up"
          className="inline-block mt-10 bg-indigo-600 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Trans comment="Create team">Create Your Team</Trans>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e0d8] px-8 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span
            className="text-xl"
            style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
          >
            {PRODUCT_NAME}
          </span>
          <span className="text-sm text-[#a8a29e]">
            <Trans comment="Footer tagline">Video review for creative teams.</Trans>
          </span>
        </div>
      </footer>
    </div>
  );
}
