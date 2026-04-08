import { Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/MarketingLayout";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME, PRICING, formatPrice } from "@/lib/product";

const painPoints = [
  {
    id: "01",
    title: "ADDING A FREELANCER SHOULDN'T COST EXTRA",
    description:
      'You hired them for a two-week project. Why are you paying a monthly seat fee? Unlimited seats. Add your whole roster — full-timers, freelancers, that one intern who\'s "really good at Premiere."',
  },
  {
    id: "02",
    title: "CLIENTS NEED NO-ACCOUNT REVIEW",
    description:
      "Your client doesn't want to create an account. They want to watch the video, leave a comment at 0:47 that says \"make it pop more,\" and move on with their day. Send a link. That's it.",
  },
  {
    id: "03",
    title: "MANAGING 12 CLIENTS SHOULDN'T REQUIRE A PM TOOL",
    description:
      "Unlimited projects, organized by team. No per-project limits, no storage gotchas. Every client gets their own space. You get your sanity back.",
  },
  {
    id: "04",
    title: "FAST TURNAROUND MEANS FAST TOOLS",
    description:
      "Client says \"I need to see it by 3pm.\" It's 2:47pm. You upload the cut, it plays instantly. No transcoding queue. No \"processing your video\" spinner. Just playback.",
  },
];

const comparisons = [
  {
    size: "5-PERSON TEAM",
    competitor: "$95",
    commentary: "That's a lot of coffee.",
  },
  {
    size: "10-PERSON TEAM",
    competitor: "$190",
    commentary: "A nice camera lens, actually.",
  },
  {
    size: "15 + FREELANCERS",
    competitor: "$285+",
    commentary: "Almost enough for one more freelancer.",
  },
];

export default function ForAgencies() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <span className="text-sm font-bold uppercase tracking-widest text-[#888]">
              <Trans comment="Page label for agencies landing page">/FOR AGENCIES</Trans>
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
            <Trans comment="Hero headline: stop per-seat pricing, start shipping work">STOP PAYING</Trans>
            <br />
            <Trans comment="Hero headline continuation: per seat pricing">PER SEAT.</Trans>
            <br />
            <span className="text-[#2d5a2d]"><Trans comment="Hero headline continuation: start shipping">START SHIPPING</Trans></span>
            <br />
            <Trans comment="Hero headline continuation: work">WORK.</Trans>
          </h1>
          <div className="mt-12 max-w-2xl">
            <p className="text-xl md:text-2xl font-medium text-[#1a1a1a]">
              <Trans comment="Hero subtext: per-seat pricing is not built for agencies">You're a 15-person agency with 30 freelancers rotating through.
              Per-seat pricing wasn't built for you. It was built to charge you
              more.</Trans>
            </p>
            <p className="text-lg text-[#888] font-medium mt-4">
              <Trans comment="Hero subtext: product is video review with unlimited seats. {PRODUCT_NAME} is the product name">{PRODUCT_NAME} is video review for creative teams. Unlimited seats. {formatPrice(PRICING.basic.price)}/month.
              The whole agency, not per editor.</Trans>
            </p>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link
              to="/sign-up"
              className="bg-[#1a1a1a] text-[#f0f0e8] px-8 py-5 border-2 border-[#1a1a1a] font-black text-lg uppercase tracking-wider hover:bg-[#2d5a2d] transition-colors shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] text-center"
            >
              <Trans comment="CTA button: start your team">START YOUR TEAM</Trans>
            </Link>
            <div className="bg-[#f0f0e8] border-2 border-[#1a1a1a] px-8 py-5 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <span className="text-3xl font-black block leading-none">
                {formatPrice(PRICING.basic.price)}<Trans comment="Per month abbreviation">/mo</Trans>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#888] mt-1 block">
                <Trans comment="Pricing clarification: unlimited seats">Unlimited seats. Seriously.</Trans>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#e8e8e0]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            <Trans comment="Pain points section heading: agency life is hard">AGENCY LIFE</Trans>
            <br />
            <Trans comment="Pain points section heading continuation">IS HARD ENOUGH.</Trans>
          </h2>
          <p className="text-xl text-[#888] font-medium mb-16 max-w-2xl">
            <Trans comment="Pain points subtext: video review shouldn't make agency life harder">Your video review tool shouldn't make it harder. Here are the
            problems we actually solve.</Trans>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {painPoints.map((point) => (
              <div
                key={point.id}
                className="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all"
              >
                <div className="border-b-2 border-[#1a1a1a] px-6 py-4 flex items-center gap-4 bg-[#1a1a1a] text-[#f0f0e8]">
                  <span className="text-sm font-black text-[#7cb87c]">
                    /{point.id}
                  </span>
                </div>
                <div className="p-6 md:p-8 flex-grow">
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight mb-4">
                    {point.id === "01" && <Trans comment="Pain point title: freelancer seat fees are too expensive">ADDING A FREELANCER SHOULDN'T COST EXTRA</Trans>}
                    {point.id === "02" && <Trans comment="Pain point title: clients need account-free review">CLIENTS NEED NO-ACCOUNT REVIEW</Trans>}
                    {point.id === "03" && <Trans comment="Pain point title: managing multiple clients shouldn't need a PM tool">MANAGING 12 CLIENTS SHOULDN'T REQUIRE A PM TOOL</Trans>}
                    {point.id === "04" && <Trans comment="Pain point title: fast turnaround requires fast tools">FAST TURNAROUND MEANS FAST TOOLS</Trans>}
                  </h3>
                  <p className="text-base font-medium text-[#1a1a1a] leading-relaxed">
                    {point.id === "01" && <Trans comment="Pain point description: product has flat price with unlimited seats. {PRODUCT_NAME} is the product name">You hired them for a two-week project. Why are you paying a monthly seat fee? {PRODUCT_NAME} is {formatPrice(PRICING.basic.price)}/month total. Unlimited seats. Add your whole roster — full-timers, freelancers, that one intern who's "really good at Premiere."</Trans>}
                    {point.id === "02" && <Trans comment="Pain point description: clients can review via link without account">Your client doesn't want to create an account. They want to watch the video, leave a comment at 0:47 that says "make it pop more," and move on with their day. Send a link. That's it.</Trans>}
                    {point.id === "03" && <Trans comment="Pain point description: unlimited projects organized by team">Unlimited projects, organized by team. No per-project limits, no storage gotchas. Every client gets their own space. You get your sanity back.</Trans>}
                    {point.id === "04" && <Trans comment="Pain point description: instant upload and playback, no transcoding queue">Client says "I need to see it by 3pm." It's 2:47pm. You upload the cut, it plays instantly. No transcoding queue. No "processing your video" spinner. Just playback.</Trans>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                <Trans comment="Cost comparison section heading: do the math">DO THE</Trans>
                <br />
                <Trans comment="Cost comparison section heading continuation">MATH.</Trans>
              </h2>
              <p className="text-xl text-[#888] font-medium max-w-sm">
                <Trans comment="Cost comparison subtext: Frame.io vs product pricing. Frame.io is a competitor name. {PRODUCT_NAME} is the product name">Frame.io charges $19/user/month. {PRODUCT_NAME} charges {formatPrice(PRICING.basic.price)}/month total.
                Here's what that looks like at agency scale.</Trans>
              </p>
            </div>

            <div className="lg:w-2/3 flex flex-col gap-6">
              {comparisons.map((row) => (
                <div
                  key={row.size}
                  className="border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Team size label */}
                    <div className="bg-[#1a1a1a] text-[#f0f0e8] p-6 md:p-8 md:w-1/3 flex flex-col justify-center border-b-2 md:border-b-0 md:border-r-2 border-[#1a1a1a]">
                      <span className="text-xs font-bold tracking-widest text-[#7cb87c] mb-1">
                        <Trans comment="Comparison table label: team size">TEAM SIZE</Trans>
                      </span>
                      <span className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">
                        {row.size === "5-PERSON TEAM" && <Trans comment="Team size: 5 person team">5-PERSON TEAM</Trans>}
                        {row.size === "10-PERSON TEAM" && <Trans comment="Team size: 10 person team">10-PERSON TEAM</Trans>}
                        {row.size === "15 + FREELANCERS" && <Trans comment="Team size: 15 plus freelancers">15 + FREELANCERS</Trans>}
                      </span>
                    </div>

                    {/* Comparison numbers */}
                    <div className="flex flex-col sm:flex-row flex-grow">
                      <div className="p-6 md:p-8 flex-1 border-b-2 sm:border-b-0 sm:border-r-2 border-[#1a1a1a] bg-[#ffffff]">
                        <span className="text-xs font-bold tracking-widest text-[#888] block mb-1">
                          <Trans comment="Competitor name label: Frame.io is a competitor product">FRAME.IO</Trans>
                        </span>
                        <span className="text-3xl font-black text-[#dc2626]">
                          {row.size === "5-PERSON TEAM" && <Trans comment="Frame.io monthly price for 5-person team">$95</Trans>}
                          {row.size === "10-PERSON TEAM" && <Trans comment="Frame.io monthly price for 10-person team">$190</Trans>}
                          {row.size === "15 + FREELANCERS" && <Trans comment="Frame.io monthly price for 15+ team">$285+</Trans>}
                        </span>
                        <span className="text-sm text-[#888] font-bold">
                          <Trans comment="Per month abbreviation">/mo</Trans>
                        </span>
                      </div>
                      <div className="p-6 md:p-8 flex-1 bg-[#f0f0e8]">
                        <span className="text-xs font-bold tracking-widest text-[#888] block mb-1">
                          <Trans comment="Product name label in comparison. {PRODUCT_NAME} is the product name">{PRODUCT_NAME}</Trans>
                        </span>
                        <span className="text-3xl font-black text-[#2d5a2d]">
                          {formatPrice(PRICING.basic.price)}
                        </span>
                        <span className="text-sm text-[#888] font-bold">
                          <Trans comment="Per month abbreviation">/mo</Trans>
                        </span>
                        <p className="text-sm font-bold text-[#888] mt-2">
                          {row.size === "5-PERSON TEAM" && <Trans comment="Savings commentary: humorous note about coffee">That's a lot of coffee.</Trans>}
                          {row.size === "10-PERSON TEAM" && <Trans comment="Savings commentary: humorous note about camera lens">A nice camera lens, actually.</Trans>}
                          {row.size === "15 + FREELANCERS" && <Trans comment="Savings commentary: humorous note about hiring another freelancer">Almost enough for one more freelancer.</Trans>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8] p-6 md:p-8">
                <p className="text-lg font-bold">
                  <span className="text-[#7cb87c]"><Trans comment="Comparison summary label">The pattern:</Trans></span>{" "}
                  <Trans comment="Comparison summary: competitors charge more as you grow, we don't">They
                  charge more as you grow. We don't. Your 50th seat costs the
                  same as your first — $0 extra.</Trans>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 bg-[#2d5a2d] text-[#f0f0e8] border-b-2 border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
            <Trans comment="Final CTA heading: start your team">START YOUR</Trans>
            <br />
            <Trans comment="Final CTA heading continuation">TEAM.</Trans>
          </h2>
          <p className="text-xl md:text-2xl font-medium mb-4 max-w-lg">
            <Trans comment="Final CTA pricing summary: flat price unlimited everything">{formatPrice(PRICING.basic.price)}/month. Unlimited seats. Unlimited projects. No per-user pricing.
            Ever.</Trans>
          </p>
          <p className="text-lg text-[#f0f0e8]/60 font-medium mb-12">
            <Trans comment="Final CTA subtext: quick setup">Set up takes about 2 minutes. Your first freelancer will thank you.</Trans>
          </p>
          <Link
            to="/sign-up"
            className="bg-[#f0f0e8] text-[#1a1a1a] px-12 py-6 border-2 border-[#f0f0e8] text-2xl font-black uppercase tracking-wider hover:bg-[#1a1a1a] hover:text-[#f0f0e8] hover:border-[#f0f0e8] transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
          >
            <Trans comment="CTA button: start your team">START YOUR TEAM</Trans>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
