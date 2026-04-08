
import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/mono")({
  component: HomepageMono,
});

export default function HomepageMono() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f0e8] text-[#1a1a1a] font-mono">
      {/* Minimal nav */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-[#f0f0e8]">
        <div className="flex items-center gap-4">
          <span className={`text-xl font-black transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>{PRODUCT_NAME}</span>
          <span className={`text-xs text-[#888] hidden sm:inline border-l border-[#ccc] pl-4 transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'}`}><Trans comment="Nav descriptor: video review">video review</Trans></span>
        </div>
        <div className="flex gap-4 text-sm">
          <Link to="/sign-in" className="hover:underline"><Trans comment="Navigation link: sign in">Sign In</Trans></Link>
          <Link to="/sign-up" className="font-bold underline underline-offset-4"><Trans comment="Navigation link: start / sign up">Start</Trans></Link>
        </div>
      </nav>

      {/* Hero - Massive brand + clear statement */}
      <section className="px-6 pt-8 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Giant product name */}
          <h1 className="text-[20vw] sm:text-[18vw] font-black leading-[0.85] tracking-tight">
            {PRODUCT_NAME}
          </h1>

          {/* What it is - immediately clear */}
          <div className="max-w-2xl mt-8">
            <p className="text-2xl sm:text-3xl font-bold leading-tight">
              <Trans comment="Hero tagline: video review for creative teams">Video review for creative teams.</Trans>
              <br />
              <span className="text-[#2d5a2d]"><Trans comment="Hero tagline emphasis: less features, no nonsense">Less features. No bull$#!t.</Trans></span>
            </p>
          </div>

          {/* Key differentiator */}
          <div className="mt-12 flex flex-wrap gap-6 items-center">
            <div className="bg-[#2d5a2d] text-[#f0f0e8] px-6 py-4">
              <span className="text-3xl font-black"><Trans comment="Price display: $5 per month">$5/mo</Trans></span>
              <span className="text-sm ml-2 opacity-70"><Trans comment="Pricing clarification: unlimited seats">unlimited seats</Trans></span>
            </div>
            <Link to="/sign-up"
              className="border-2 border-[#1a1a1a] px-6 py-4 font-bold hover:bg-[#1a1a1a] hover:text-[#f0f0e8] transition-colors"
            >
              <Trans comment="CTA button: get started">{"Get Started \u2192"}</Trans>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple value props */}
      <section className="border-y-2 border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4">
          {[
            { id: "frame-accurate", title: "Frame-accurate", desc: "Comments on exact frames" },
            { id: "unlimited-seats", title: "Unlimited seats", desc: "One price for everyone" },
            { id: "fast-response", title: "0.3s response", desc: "Built for speed" },
            { id: "any-nle", title: "Any NLE", desc: "No lock-in" },
          ].map((item, i) => (
            <div key={item.id} className={`p-6 ${i < 3 ? 'border-r-2 border-[#1a1a1a]' : ''} ${i < 2 ? 'lg:border-r-2' : 'lg:border-r-0'}`}>
              <div className="font-black">
                {item.id === "frame-accurate" && <Trans comment="Feature title: frame-accurate comments">Frame-accurate</Trans>}
                {item.id === "unlimited-seats" && <Trans comment="Feature title: unlimited seats">Unlimited seats</Trans>}
                {item.id === "fast-response" && <Trans comment="Feature title: 0.3 second response time">0.3s response</Trans>}
                {item.id === "any-nle" && <Trans comment="Feature title: works with any NLE (non-linear editor)">Any NLE</Trans>}
              </div>
              <div className="text-sm text-[#888]">
                {item.id === "frame-accurate" && <Trans comment="Feature description: comments land on exact frames">Comments on exact frames</Trans>}
                {item.id === "unlimited-seats" && <Trans comment="Feature description: one price for everyone">One price for everyone</Trans>}
                {item.id === "fast-response" && <Trans comment="Feature description: built for speed">Built for speed</Trans>}
                {item.id === "any-nle" && <Trans comment="Feature description: no vendor lock-in">No lock-in</Trans>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison - straightforward */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-2"><Trans comment="Comparison section heading. {PRODUCT_NAME} is the product name">How {PRODUCT_NAME} compares</Trans></h2>
          <p className="text-[#888] mb-8"><Trans comment="Comparison section subtext. Frame.io is a competitor name">Frame.io is solid software. Here's where we differ.</Trans></p>

          <div className="space-y-6">
            {/* Pricing comparison - the big one */}
            <div className="bg-[#1a1a1a] text-[#f0f0e8] p-8">
              <div className="text-sm tracking-widest text-[#7cb87c] mb-4"><Trans comment="Comparison category: pricing model">PRICING MODEL</Trans></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <div className="text-[#888] text-sm mb-1"><Trans comment="Competitor name: Frame.io">Frame.io</Trans></div>
                  <div className="text-2xl font-black"><Trans comment="Frame.io pricing: $19 per editor per month">$19/editor/mo</Trans></div>
                  <div className="text-sm text-[#888] mt-2"><Trans comment="Frame.io annual cost for team of 5">Team of 5 = $1,140/year</Trans></div>
                </div>
                <div>
                  <div className="text-[#7cb87c] text-sm mb-1"><Trans comment="Product name label. {PRODUCT_NAME} is the product name">{PRODUCT_NAME}</Trans></div>
                  <div className="text-2xl font-black text-[#7cb87c]"><Trans comment="Product pricing: $5/month total">$5/mo total</Trans></div>
                  <div className="text-sm text-[#888] mt-2"><Trans comment="Product annual cost for team of 5">Team of 5 = $60/year</Trans></div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-[#333]">
                <span className="text-sm text-[#888]"><Trans comment="Annual savings label with 5 users">Annual savings with 5 users: </Trans></span>
                <span className="text-xl font-black text-[#7cb87c]"><Trans comment="Annual savings amount: $1,080">$1,080</Trans></span>
              </div>
            </div>

            {/* Other differences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-[#1a1a1a] p-6">
                <div className="font-black mb-2"><Trans comment="Competitor comparison card heading: Frame.io">Frame.io</Trans></div>
                <ul className="text-sm text-[#888] space-y-1">
                  <li><Trans comment="Frame.io advantage: deep Adobe integration">• Deep Adobe integration</Trans></li>
                  <li><Trans comment="Frame.io advantage: more enterprise features">• More enterprise features</Trans></li>
                  <li><Trans comment="Frame.io advantage: larger ecosystem">• Larger ecosystem</Trans></li>
                </ul>
              </div>
              <div className="border-2 border-[#2d5a2d] p-6">
                <div className="font-black text-[#2d5a2d] mb-2"><Trans comment="Product comparison card heading. {PRODUCT_NAME} is the product name">{PRODUCT_NAME}</Trans></div>
                <ul className="text-sm space-y-1">
                  <li><Trans comment="Product advantage: works with any software">• Works with any software</Trans></li>
                  <li><Trans comment="Product advantage: simpler faster interface">• Simpler, faster interface</Trans></li>
                  <li><Trans comment="Product advantage: no per-seat pricing">• No per-seat pricing</Trans></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - visual */}
      <section className="bg-[#1a1a1a] text-[#f0f0e8] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-12"><Trans comment="How it works section heading">How it works</Trans></h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            {[
              { step: "1", id: "upload" },
              { step: "2", id: "share" },
              { step: "3", id: "click" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-16 h-16 bg-[#2d5a2d] flex items-center justify-center text-3xl font-black">
                  {item.step}
                </span>
                <div>
                  <div className="text-xl font-black">
                    {item.id === "upload" && <Trans comment="Step 1 action: upload">Upload</Trans>}
                    {item.id === "share" && <Trans comment="Step 2 action: share">Share</Trans>}
                    {item.id === "click" && <Trans comment="Step 3 action: click to comment">Click</Trans>}
                  </div>
                  <div className="text-sm text-[#888]">
                    {item.id === "upload" && <Trans comment="Step 1 description: your video">your video</Trans>}
                    {item.id === "share" && <Trans comment="Step 2 description: the link">the link</Trans>}
                    {item.id === "click" && <Trans comment="Step 3 description: to comment">to comment</Trans>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 py-16 border-b-2 border-[#1a1a1a]">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl sm:text-3xl font-bold leading-tight">
            <Trans comment="Testimonial quote from Theo about building the product. {PRODUCT_NAME} is the product name. Frame.io is a competitor name">"I built {PRODUCT_NAME} because I got tired of waiting for Frame.io to load.
            Video review should be instant."</Trans>
          </blockquote>
          <p className="mt-4 text-[#888]">— <a href="https://x.com/theo" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1a1a1a]">Theo</a></p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-black">
            <Trans comment="CTA heading: pick your plan">Pick your plan</Trans>
          </h2>
          <p className="text-xl text-[#888] mt-4 mb-8">
            <Trans comment="CTA subtext: pricing tiers">Basic is $5/month. Pro is $25/month.</Trans>
          </p>
          <Link to="/sign-up"
            className="inline-block bg-[#2d5a2d] text-[#f0f0e8] px-12 py-5 text-xl font-black hover:bg-[#3a6a3a] transition-colors"
          >
            <Trans comment="CTA button: start with basic plan">Start with Basic</Trans>
          </Link>
          <p className="mt-4 text-sm text-[#888]"><Trans comment="Upgrade note: can upgrade to Pro anytime">Upgrade to Pro anytime</Trans></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#1a1a1a] px-6 py-8">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-sm">
          <span className="font-black text-xl">{PRODUCT_NAME}</span>
        </div>
      </footer>
    </div>
  );
}
