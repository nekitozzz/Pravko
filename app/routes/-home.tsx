import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { MarketingFooter } from "@/components/MarketingFooter";
import { PRODUCT_NAME, PRODUCT_URL, PRICING, formatPrice } from "@/lib/product";

export default function Homepage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Force light mode variables for the homepage to override the global app.css dark mode behavior
  const lightModeVars = {
    '--background': '#f0f0e8',
    '--background-alt': '#1a1a1a',
    '--surface': '#ffffff',
    '--surface-alt': '#e8e8e0',
    '--surface-strong': '#1a1a1a',
    '--surface-muted': '#d8d8d0',
    '--foreground': '#1a1a1a',
    '--foreground-muted': '#888888',
    '--foreground-subtle': '#aaaaaa',
    '--foreground-inverse': '#f0f0e8',
    '--border': '#1a1a1a',
    '--border-subtle': '#cccccc',
    '--accent': '#2d5a2d',
    '--accent-hover': '#3a6a3a',
    '--accent-light': '#7cb87c',
    '--shadow-color': '#1a1a1a',
    '--shadow-accent': 'rgba(45,90,45,1)',
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen font-mono selection:bg-[#2d5a2d] selection:text-[#f0f0e8]"
      style={{ ...lightModeVars, backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Minimal nav */}
      <nav className={`fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-200 ${scrolled ? 'bg-[#f0f0e8] text-[#1a1a1a] border-b-2 border-[#1a1a1a]' : 'bg-transparent text-[#f0f0e8] drop-shadow-md'}`}>
        <div className="flex items-center gap-4">
          <span className={`text-xl font-black tracking-tighter transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>{PRODUCT_NAME}</span>
        </div>
        <div className="flex gap-6 items-center text-sm font-bold uppercase tracking-wide">
          <a href="#pricing" className="hover:underline underline-offset-4"><Trans comment="Nav link to pricing section">Pricing</Trans></a>
          <Link to="/compare/frameio" className={`hover:underline underline-offset-4 hidden sm:block`}><Trans comment="Nav link to comparison page">Compare</Trans></Link>
          <Link to="/sign-in" className="hover:underline underline-offset-4"><Trans comment="Nav link to sign in page">Log in</Trans></Link>
          <Link to="/sign-up" className={`px-4 py-2 border-2 transition-colors ${scrolled ? 'border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0f0e8]' : 'border-[#f0f0e8] hover:bg-[#f0f0e8] hover:text-[#1a1a1a]'}`}><Trans comment="Nav button to start using the product">Start</Trans></Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative px-6 pt-32 pb-32 md:pb-24 min-h-[85vh] flex flex-col justify-end bg-cover bg-center bg-no-repeat text-[#f0f0e8] border-b-2 border-[#1a1a1a] overflow-x-clip"
        style={{ backgroundImage: `url('/grassy-bg.avif')` }}
      >
        {/* Lighter tint since text is now in highly contrasting blocks or heavily shadowed */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Massive Title with Brutalist Depth */}
          <h1
            className="text-[25vw] sm:text-[22vw] font-black leading-[0.75] tracking-tighter ml-[-0.5vw]"
            style={{
              textShadow: '8px 8px 0 #1a1a1a, 0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            {PRODUCT_NAME}
          </h1>

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-12 mt-20 md:mt-24">

            {/* Highly Creative Contrast Subheadline Blocks (Stickers) */}
            <div className="flex flex-col items-start gap-4 md:gap-6 max-w-full">
              <div className="bg-[#f0f0e8] text-[#1a1a1a] px-5 py-3 md:px-8 md:py-4 border-2 border-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] -rotate-2 origin-bottom-left max-w-full">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight md:leading-none"><Trans comment="Hero tagline describing the product purpose">Video review for creative teams.</Trans></p>
              </div>
              <div className="bg-[#2d5a2d] text-[#f0f0e8] px-5 py-3 md:px-8 md:py-4 border-2 border-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] rotate-1 origin-top-left ml-2 md:ml-8 max-w-full">
                <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight md:leading-none"><Trans comment="Hero sub-tagline emphasizing simplicity">Less features. No bull$#!t.</Trans></p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 lg:justify-end pb-2 mt-4 lg:mt-0">
              <div className="bg-[#f0f0e8] text-[#1a1a1a] px-6 py-4 md:px-8 md:py-5 border-2 border-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] self-start sm:self-auto">
                <span className="text-3xl md:text-4xl font-black block leading-none">{formatPrice(PRICING.basic.price)}<Trans comment="Per month abbreviation">/mo</Trans></span>
                <span className="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#888] mt-1 md:mt-2"><Trans comment="Unlimited seats pricing detail">Unlimited seats</Trans></span>
              </div>
              <Link to="/sign-up"
                className="bg-[#1a1a1a] text-[#f0f0e8] px-6 py-4 md:px-8 md:py-5 border-2 border-[#1a1a1a] font-black text-lg md:text-xl hover:bg-[#2d5a2d] transition-colors flex items-center justify-center shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] md:hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] self-start sm:self-auto"
              >
                <Trans comment="CTA button to start free trial">START FREE TRIAL →</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brutalist Value Props Bar */}
      <section className="border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#1a1a1a]">
          {[
            { id: "01", title: <Trans comment="Value prop: product is self-hosted">SELF-HOSTED</Trans>, desc: <Trans comment="Value prop description: self-hosted details">Your data, your servers. Full control over your video pipeline.</Trans> },
            { id: "02", title: <Trans comment="Value prop: product is fast">ACTUALLY FAST</Trans>, desc: <Trans comment="Value prop description: speed details">Instant playback. Built for speed, not loading spinners.</Trans> },
            { id: "03", title: <Trans comment="Value prop: flat pricing model">FLAT PRICING</Trans>, desc: <Trans comment="Value prop description: pricing details">{formatPrice(PRICING.basic.price)} covers the whole agency. Stop counting seats.</Trans> },
            { id: "04", title: <Trans comment="Value prop: easy sharing">SIMPLE SHARING</Trans>, desc: <Trans comment="Value prop description: sharing details">Just copy the link and send it to your client.</Trans> },
          ].map((item, i) => (
            <div key={i} className="p-8 lg:p-12 group hover:bg-[#1a1a1a] hover:text-[#f0f0e8] transition-colors flex flex-col">
              <div className="text-sm font-black text-[#888] group-hover:text-[#7cb87c] mb-8">/{item.id}</div>
              <h3 className="text-3xl lg:text-4xl font-black mb-4 uppercase tracking-tighter leading-none">{item.title}</h3>
              <p className="text-lg font-medium opacity-80 mt-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works - Completely Rethought */}
      <section className="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16 text-center">
            <Trans comment="Section heading for how the product works">HOW IT WORKS.</Trans>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: "1", action: <Trans comment="How it works step 1: upload action">UPLOAD</Trans>, desc: <Trans comment="How it works step 1 description">Drag and drop your cut. We process it instantly.</Trans> },
              { step: "2", action: <Trans comment="How it works step 2: share action">SHARE</Trans>, desc: <Trans comment="How it works step 2 description">Send a link. No account required for clients.</Trans> },
              { step: "3", action: <Trans comment="How it works step 3: review action">REVIEW</Trans>, desc: <Trans comment="How it works step 3 description">Click to comment on exact frames. Export to your NLE.</Trans> },
            ].map((item, i) => (
              <div key={i} className="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[12px_12px_0px_0px_var(--shadow-color)] flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
                <div className="border-b-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8] p-6 flex justify-between items-end">
                  <span className="text-7xl font-black leading-none">{item.step}</span>
                  <span className="text-xl font-bold tracking-widest text-[#888] mb-1"><Trans comment="Label for step number in how-it-works cards">STEP</Trans></span>
                </div>
                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-[#2d5a2d]">{item.action}</h3>
                  <p className="text-lg font-medium text-[#1a1a1a]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                <Trans comment="Comparison section heading">THE<br/>RIVAL.</Trans>
              </h2>
              <p className="text-xl text-[#888] font-medium max-w-sm">
                <Trans comment="Comparison section description, Frame.io is a competitor product name">Frame.io is solid software. But you're paying for enterprise features you don't need.</Trans>
              </p>
            </div>

            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-[#1a1a1a] shadow-[12px_12px_0px_0px_var(--shadow-color)]">
                {/* Competitor */}
                <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-[#1a1a1a] bg-[#ffffff]">
                  <div className="text-sm font-bold tracking-widest text-[#888] mb-2"><Trans comment="Label for the competitor column">THE OTHER GUYS</Trans></div>
                  <div className="text-5xl font-black tracking-tighter mb-8">Frame.io</div>

                  <div className="mb-8">
                    <div className="text-3xl font-black"><Trans comment="Competitor price per user">$19</Trans></div>
                    <div className="text-[#888] font-bold uppercase text-sm tracking-wider"><Trans comment="Competitor pricing model">Per user / month</Trans></div>
                  </div>

                  <ul className="space-y-4 text-lg font-medium text-[#1a1a1a]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#dc2626] font-black">&times;</span>
                      <Trans comment="Competitor downside: complex interface">Complex interface</Trans>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#dc2626] font-black">&times;</span>
                      <Trans comment="Competitor downside: per-seat pricing penalizes growth">Punishes you for growing</Trans>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#dc2626] font-black">&times;</span>
                      <Trans comment="Competitor downside: too many features">Bloated ecosystem</Trans>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#dc2626] font-black">&times;</span>
                      <Trans comment="Competitor downside: no self-hosting option">No self-hosting</Trans>
                    </li>
                  </ul>
                </div>

                {/* Us */}
                <div className="p-8 md:p-12 bg-[#1a1a1a] text-[#f0f0e8]">
                  <div className="text-sm font-bold tracking-widest text-[#7cb87c] mb-2"><Trans comment="Label for product column in comparison">THE SOLUTION</Trans></div>
                  <div className="text-5xl font-black tracking-tighter mb-8 text-[#7cb87c]">{PRODUCT_NAME}</div>

                  <div className="mb-8">
                    <div className="text-3xl font-black text-[#7cb87c]">{formatPrice(PRICING.basic.price)}</div>
                    <div className="text-[#888] font-bold uppercase text-sm tracking-wider"><Trans comment="Product pricing model: flat monthly rate">Flat total / month</Trans></div>
                  </div>

                  <ul className="space-y-4 text-lg font-medium">
                    <li className="flex items-start gap-3">
                      <span className="text-[#7cb87c] font-black">&#10003;</span>
                      <Trans comment="Product advantage: fast performance">Stupidly fast</Trans>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#7cb87c] font-black">&#10003;</span>
                      <Trans comment="Product advantage: unlimited team members">Invite the whole team</Trans>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#7cb87c] font-black">&#10003;</span>
                      <Trans comment="Product advantage: focused feature set">Just what you need</Trans>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#7cb87c] font-black">&#10003;</span>
                      <Trans comment="Product advantage: self-hosted option">Self-hosted option</Trans>
                    </li>
                  </ul>

                  <div className="mt-12 pt-6 border-t border-[#333]">
                    <span className="block text-sm font-bold text-[#888] uppercase tracking-wider mb-1"><Trans comment="Label for pricing comparison">Your price (any team size)</Trans></span>
                    <span className="text-4xl font-black text-[#7cb87c]">{formatPrice(PRICING.basic.price)}<span className="text-lg"><Trans comment="Per month abbreviation">/mo</Trans></span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 py-32 bg-[#2d5a2d] text-[#f0f0e8] border-b-2 border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto text-center">
          <blockquote className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
            <Trans comment="Testimonial quote from the founder. {PRODUCT_NAME} is the product name, keep untranslated. Frame.io is a competitor name">"I built {PRODUCT_NAME} because I got tired of waiting for Frame.io to load. Video review should be instant."</Trans>
          </blockquote>
          <a href="https://x.com/theo" target="_blank" rel="noopener noreferrer" className="inline-block border-2 border-[#f0f0e8] px-6 py-3 font-bold uppercase tracking-wider hover:bg-[#f0f0e8] hover:text-[#2d5a2d] transition-colors">
            <Trans comment="Attribution for the testimonial quote">&mdash; Theo</Trans>
          </a>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#e8e8e0]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16 text-center">
            <Trans comment="Pricing section heading">PRICING.</Trans>
          </h2>

          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {/* $5 Plan */}
            <div className="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 w-full max-w-md flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
              <div className="text-xl font-bold uppercase tracking-widest text-[#888] mb-2"><Trans comment="Basic pricing tier name">Basic</Trans></div>
              <div className="text-6xl font-black tracking-tighter mb-4">{formatPrice(PRICING.basic.price)}<span className="text-2xl text-[#888]"><Trans comment="Per month abbreviation">/mo</Trans></span></div>
              <p className="text-lg font-medium text-[#1a1a1a] mb-8"><Trans comment="Basic plan description">Unlimited everything, except storage.</Trans></p>

              <ul className="space-y-4 text-lg font-bold flex-grow mb-8">
                <li className="flex items-center gap-3"><span className="text-[#2d5a2d] text-2xl">&#10003;</span> <Trans comment="Basic plan feature: unlimited seats">Unlimited seats</Trans></li>
                <li className="flex items-center gap-3"><span className="text-[#2d5a2d] text-2xl">&#10003;</span> <Trans comment="Basic plan feature: unlimited projects">Unlimited projects</Trans></li>
                <li className="flex items-center gap-3"><span className="text-[#2d5a2d] text-2xl">&#10003;</span> <Trans comment="Basic plan feature: unlimited clients">Unlimited clients</Trans></li>
                <li className="flex items-center gap-3"><span className="text-[#2d5a2d] text-2xl">&#10003;</span> <Trans comment="Basic plan feature: storage amount">{PRICING.basic.storageLabel} Storage</Trans></li>
              </ul>

              <Link to="/sign-up" className="bg-[#1a1a1a] text-[#f0f0e8] text-center py-4 border-2 border-[#1a1a1a] font-black uppercase hover:bg-[#2d5a2d] transition-colors"><Trans comment="CTA button to get the Basic plan">Get Basic</Trans></Link>
            </div>

            {/* $25 Plan */}
            <div className="bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 w-full max-w-md flex flex-col transform md:-translate-y-4 hover:-translate-y-6 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xl font-bold uppercase tracking-widest text-[#7cb87c]"><Trans comment="Pro pricing tier name">Pro</Trans></div>
                <div className="bg-[#2d5a2d] text-xs font-black px-2 py-1 uppercase tracking-wider -rotate-3"><Trans comment="Badge highlighting Pro plan has large file support">Big files</Trans></div>
              </div>
              <div className="text-6xl font-black tracking-tighter mb-4">{formatPrice(PRICING.pro.price)}<span className="text-2xl text-[#888]"><Trans comment="Per month abbreviation">/mo</Trans></span></div>
              <p className="text-lg font-medium mb-8"><Trans comment="Pro plan description">Literally the exact same thing but more space.</Trans></p>

              <ul className="space-y-4 text-lg font-bold flex-grow mb-8">
                <li className="flex items-center gap-3"><span className="text-[#7cb87c] text-2xl">&#10003;</span> <Trans comment="Pro plan feature: unlimited seats">Unlimited seats</Trans></li>
                <li className="flex items-center gap-3"><span className="text-[#7cb87c] text-2xl">&#10003;</span> <Trans comment="Pro plan feature: unlimited projects">Unlimited projects</Trans></li>
                <li className="flex items-center gap-3"><span className="text-[#7cb87c] text-2xl">&#10003;</span> <Trans comment="Pro plan feature: unlimited clients">Unlimited clients</Trans></li>
                <li className="flex items-center gap-3"><span className="text-[#7cb87c] text-2xl">&#10003;</span> <Trans comment="Pro plan feature: storage amount">{PRICING.pro.storageLabel} Storage</Trans></li>
              </ul>

              <Link to="/sign-up" className="bg-[#f0f0e8] text-[#1a1a1a] text-center py-4 border-2 border-[#f0f0e8] font-black uppercase hover:bg-[#d8d8d0] transition-colors"><Trans comment="CTA button to get the Pro plan">Get Pro</Trans></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Massive CTA */}
      <section className="px-6 py-32 bg-[#f0f0e8]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
            <Trans comment="Final CTA section heading">START<br/>NOW.</Trans>
          </h2>
          <p className="text-2xl text-[#888] font-medium mb-12">
            <Trans comment="Final CTA pricing summary">Basic is {formatPrice(PRICING.basic.price)}/month. Pro is {formatPrice(PRICING.pro.price)}/month.</Trans>
          </p>
          <Link to="/sign-up"
            className="bg-[#1a1a1a] text-[#f0f0e8] px-12 py-6 border-2 border-[#1a1a1a] text-2xl font-black uppercase tracking-wider hover:bg-[#2d5a2d] hover:border-[#2d5a2d] transition-colors shadow-[12px_12px_0px_0px_var(--shadow-accent)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
          >
            <Trans comment="CTA button to create a team">CREATE YOUR TEAM</Trans>
          </Link>
        </div>
      </section>

      <MarketingFooter />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: PRODUCT_NAME,
            description: t({
              message: "Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, flat pricing.",
              comment: "JSON-LD meta description for search engines",
            }),
            url: PRODUCT_URL,
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            offers: [
              {
                "@type": "Offer",
                name: PRICING.basic.name,
                price: String(PRICING.basic.price) + ".00",
                priceCurrency: PRICING.currency,
                description: t({
                  message: `Unlimited seats, unlimited projects, unlimited clients, ${PRICING.basic.storageLabel} storage`,
                  comment: "JSON-LD description for Basic plan offer",
                }),
              },
              {
                "@type": "Offer",
                name: PRICING.pro.name,
                price: String(PRICING.pro.price) + ".00",
                priceCurrency: PRICING.currency,
                description: t({
                  message: `Unlimited seats, unlimited projects, unlimited clients, ${PRICING.pro.storageLabel} storage`,
                  comment: "JSON-LD description for Pro plan offer",
                }),
              },
            ],
            creator: {
              "@type": "Person",
              name: "Theo",
              url: "https://x.com/theo",
            },
          }),
        }}
      />
    </div>
  );
}
