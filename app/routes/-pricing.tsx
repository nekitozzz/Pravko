import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { MarketingLayout } from "@/components/MarketingLayout";
import { PRODUCT_NAME, PRICING, formatPrice } from "@/lib/product";

export default function PricingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-24 bg-[#f0f0e8] border-b-2 border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
            <Trans comment="Pricing page heading">PRICING.</Trans>
          </h1>
          <p className="text-2xl md:text-3xl font-bold mt-8 max-w-2xl">
            <Trans comment="Pricing page subheading emphasizing flat pricing model">{formatPrice(PRICING.basic.price)}/mo. Not per user. Not per project.{" "}
            <span className="text-[#888]">Total.</span></Trans>
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-24 md:py-32 bg-[#e8e8e0] border-b-2 border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {/* Basic */}
            <div className="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-8 w-full max-w-md flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_#1a1a1a] transition-all">
              <div className="text-xl font-bold uppercase tracking-widest text-[#888] mb-2">
                <Trans comment="Basic pricing tier name">Basic</Trans>
              </div>
              <div className="text-6xl font-black tracking-tighter mb-4">
                {formatPrice(PRICING.basic.price)}<span className="text-2xl text-[#888]"><Trans comment="Per month abbreviation">/mo</Trans></span>
              </div>
              <p className="text-lg font-medium text-[#1a1a1a] mb-8">
                <Trans comment="Basic plan description">Unlimited everything, except storage.</Trans>
              </p>

              <ul className="space-y-4 text-lg font-bold flex-grow mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-[#2d5a2d] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Basic plan feature: unlimited seats">Unlimited seats</Trans>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#2d5a2d] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Basic plan feature: unlimited projects">Unlimited projects</Trans>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#2d5a2d] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Basic plan feature: unlimited clients">Unlimited clients</Trans>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#2d5a2d] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Basic plan feature: storage amount">{PRICING.basic.storageLabel} Storage</Trans>
                </li>
              </ul>

              <Link
                to="/sign-up"
                className="bg-[#1a1a1a] text-[#f0f0e8] text-center py-4 border-2 border-[#1a1a1a] font-black uppercase hover:bg-[#2d5a2d] transition-colors"
              >
                <Trans comment="CTA button to get the Basic plan">Get Basic</Trans>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-8 w-full max-w-md flex flex-col transform md:-translate-y-4 hover:-translate-y-6 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_#1a1a1a] transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xl font-bold uppercase tracking-widest text-[#7cb87c]">
                  <Trans comment="Pro pricing tier name">Pro</Trans>
                </div>
                <div className="bg-[#2d5a2d] text-xs font-black px-2 py-1 uppercase tracking-wider -rotate-3">
                  <Trans comment="Badge highlighting Pro plan has large file support">Big files</Trans>
                </div>
              </div>
              <div className="text-6xl font-black tracking-tighter mb-4">
                {formatPrice(PRICING.pro.price)}<span className="text-2xl text-[#888]"><Trans comment="Per month abbreviation">/mo</Trans></span>
              </div>
              <p className="text-lg font-medium mb-8">
                <Trans comment="Pro plan description">Literally the exact same thing but more space.</Trans>
              </p>

              <ul className="space-y-4 text-lg font-bold flex-grow mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-[#7cb87c] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Pro plan feature: unlimited seats">Unlimited seats</Trans>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#7cb87c] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Pro plan feature: unlimited projects">Unlimited projects</Trans>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#7cb87c] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Pro plan feature: unlimited clients">Unlimited clients</Trans>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#7cb87c] text-2xl">&#10003;</span>{" "}
                  <Trans comment="Pro plan feature: storage amount">{PRICING.pro.storageLabel} Storage</Trans>
                </li>
              </ul>

              <Link
                to="/sign-up"
                className="bg-[#f0f0e8] text-[#1a1a1a] text-center py-4 border-2 border-[#f0f0e8] font-black uppercase hover:bg-[#d8d8d0] transition-colors"
              >
                <Trans comment="CTA button to get the Pro plan">Get Pro</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 md:py-32 bg-[#f0f0e8] border-b-2 border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16">
            <Trans comment="FAQ section heading">FAQ.</Trans>
          </h2>

          {([
            {
              label: <Trans comment="FAQ group: getting started">Getting Started</Trans>,
              items: [
                {
                  q: <Trans comment="FAQ question about free trial availability">Is there a free trial?</Trans>,
                  a: <Trans comment="FAQ answer: 7-day free trial with full access">Yes. 7-day free trial, no credit card required. Full access to all features during trial.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about creating a team">How do I create a team?</Trans>,
                  a: <Trans comment="FAQ answer: sign up and name your team">Sign up, name your team — done. Invite editors, producers, clients. All seats are free.</Trans>,
                },
              ],
            },
            {
              label: <Trans comment="FAQ group: plans and billing">Plans & Billing</Trans>,
              items: [
                {
                  q: <Trans comment="FAQ question about available plans">What plans are available?</Trans>,
                  a: <Trans comment="FAQ answer: Basic and Pro plans with pricing">Basic ({formatPrice(PRICING.basic.price)}/mo, {PRICING.basic.storageLabel}) and Pro ({formatPrice(PRICING.pro.price)}/mo, {PRICING.pro.storageLabel}). Both include unlimited seats, projects, and clients.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about what counts as a seat">What counts as a seat?</Trans>,
                  a: <Trans comment="FAQ answer: seats include all team members, no extra charge">Anyone on your team. Invite everyone — editors, producers, clients. No extra charge.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about how billing works">How does billing work?</Trans>,
                  a: <Trans comment="FAQ answer: monthly billing for whole team">Monthly billing. Pay once — your whole team is covered. No per-user fees.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about accepted payment methods">What payment methods do you accept?</Trans>,
                  a: <Trans comment="FAQ answer: bank cards via YooKassa">Bank cards (Visa, Mastercard, Mir) via YooKassa.</Trans>,
                },
              ],
            },
            {
              label: <Trans comment="FAQ group: subscription and access">Subscription & Access</Trans>,
              items: [
                {
                  q: <Trans comment="FAQ question about what happens after trial ends">What happens after the trial ends?</Trans>,
                  a: <Trans comment="FAQ answer: need to subscribe to continue uploading">You'll need to subscribe to continue uploading videos and leaving comments. Existing videos remain viewable during the grace period.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about what's available without subscription">What can I do without an active subscription?</Trans>,
                  a: <Trans comment="FAQ answer: view videos and read comments only">View videos and read comments. Uploading, commenting, downloading, and resolving comments require an active subscription.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about data retention after cancellation">What happens to my data if I cancel?</Trans>,
                  a: <Trans comment="FAQ answer: data retained with grace period, then videos deleted">Your data stays accessible until the end of the billing period. After that, there's a 10-day grace period. If you don't resubscribe, video files are permanently deleted. Comments are preserved and can be recovered if you re-upload.</Trans>,
                },
              ],
            },
            {
              label: <Trans comment="FAQ group: videos and storage">Videos & Storage</Trans>,
              items: [
                {
                  q: <Trans comment="FAQ question about hitting storage limit">What happens if I hit the storage limit?</Trans>,
                  a: <Trans comment="FAQ answer: upgrade to Pro or delete old projects">Upgrade to Pro for more space, or delete old projects. You won't be able to upload new videos until you free up space.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about supported video formats">What video formats are supported?</Trans>,
                  a: <Trans comment="FAQ answer: common formats transcoded to HLS">MP4, MOV, WebM, and most common formats. Videos are automatically transcoded to HLS for fast streaming.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about video processing workflow">How does video processing work?</Trans>,
                  a: <Trans comment="FAQ answer: automatic transcoding to adaptive streaming">Upload your file, it's automatically transcoded into adaptive streaming format. Processing time depends on file size — usually a few minutes.</Trans>,
                },
              ],
            },
            {
              label: <Trans comment="FAQ group: sharing and collaboration">Sharing & Collaboration</Trans>,
              items: [
                {
                  q: <Trans comment="FAQ question about client review without account">Can clients review without an account?</Trans>,
                  a: <Trans comment="FAQ answer: clients can watch and comment via share link without signing up">Yes. Send a share link. They click, watch, and comment. No sign-up required.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about how share links work">How do share links work?</Trans>,
                  a: <Trans comment="FAQ answer: generate link with optional password and expiration, recipients watch and comment without signing up">Generate a link for any video. Optionally add a password and expiration date. Recipients watch and comment without signing up.</Trans>,
                },
                {
                  q: <Trans comment="FAQ question about available team roles">What roles are available in a team?</Trans>,
                  a: <Trans comment="FAQ answer: owner, admin, member, viewer roles">Owner (full control + billing), Admin (manage members + content), Member (upload + comment), Viewer (watch + comment only).</Trans>,
                },
              ],
            },
            {
              label: <Trans comment="FAQ group: self-hosting">Self-hosting</Trans>,
              items: [
                {
                  q: <Trans comment="FAQ question about self-hosting. {PRODUCT_NAME} is the product name, keep untranslated">Can I self-host {PRODUCT_NAME}?</Trans>,
                  a: <Trans comment="FAQ answer: self-hosting is available with contact email">Yes. Deploy on your own infrastructure with full control over your data and video pipeline. Contact us at help@pravko.ru to get started.</Trans>,
                },
              ],
            },
          ] as const).map((group, gi) => (
            <div key={gi}>
              <div className="pt-12 pb-4">
                <span className="text-sm font-bold uppercase tracking-widest text-[#888]">
                  {group.label}
                </span>
              </div>
              <div className="divide-y-2 divide-[#1a1a1a] border-y-2 border-[#1a1a1a]">
                {group.items.map((item, i) => (
                  <div key={i} className="py-8">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3">
                      {item.q}
                    </h3>
                    <p className="text-lg font-medium text-[#888]">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 bg-[#1a1a1a] text-[#f0f0e8]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            <Trans comment="Final CTA section heading">Still reading?</Trans>
          </h2>
          <p className="text-xl text-[#888] font-medium mb-12">
            <Trans comment="Final CTA subtext encouraging sign-up">Just try it. No credit card. No commitment.</Trans>
          </p>
          <Link
            to="/sign-up"
            className="bg-[#f0f0e8] text-[#1a1a1a] px-12 py-6 border-2 border-[#f0f0e8] text-2xl font-black uppercase tracking-wider hover:bg-[#2d5a2d] hover:text-[#f0f0e8] hover:border-[#2d5a2d] transition-colors shadow-[8px_8px_0px_0px_rgba(45,90,45,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(45,90,45,1)]"
          >
            <Trans comment="CTA button to start free trial">START FREE TRIAL</Trans>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
