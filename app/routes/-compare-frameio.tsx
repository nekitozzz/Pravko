import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { MarketingLayout } from "@/components/MarketingLayout";
import { PRODUCT_NAME, PRICING, formatPrice } from "@/lib/product";

const FRAMEIO_PRICE_PER_USER = 19;

function getComparisonRows() {
  return [
    {
      feature: t({ message: "Price", comment: "Comparison table row label" }),
      frameio: t({ message: "$19/user/month", comment: "Frame.io pricing — currency string" }),
      product: t({ message: `${formatPrice(PRICING.basic.price)}/month. Total.`, comment: "Product comparison value" }),
      note: t({ message: "Math is hard, but not that hard.", comment: "Humorous note about pricing comparison" }),
    },
    {
      feature: t({ message: "Seats", comment: "Comparison table row label — number of user seats" }),
      frameio: t({ message: "Limited by plan tier", comment: "Frame.io seat limitation" }),
      product: t({ message: "Unlimited", comment: "Product seat availability" }),
      note: t({ message: "Your intern deserves access too.", comment: "Humorous note about unlimited seats" }),
    },
    {
      feature: t({ message: "Speed", comment: "Comparison table row label" }),
      frameio: t({ message: "It's... fine", comment: "Tongue-in-cheek description of Frame.io speed" }),
      product: t({ message: "Actually fast", comment: "Product comparison value" }),
      note: t({ message: "We obsess over this so you don't wait.", comment: "Note about speed priority" }),
    },
    {
      feature: t({ message: "Self-hosting", comment: "Comparison table row label" }),
      frameio: t({ message: "No", comment: "Frame.io has no self-hosting" }),
      product: t({ message: "Yes", comment: "Product supports self-hosting" }),
      note: t({ message: "Your data, your servers.", comment: "Note about self-hosting capability" }),
    },
    {
      feature: t({ message: "Sharing", comment: "Comparison table row label — how sharing works" }),
      frameio: t({ message: "Account required", comment: "Frame.io requires account to view shared content" }),
      product: t({ message: "Just a link", comment: "Product comparison value — sharing via link" }),
      note: t({ message: "Your clients don't want another login.", comment: "Note about simple sharing" }),
    },
    {
      feature: t({ message: "Setup", comment: "Comparison table row label — onboarding process" }),
      frameio: t({ message: "Call sales for enterprise", comment: "Frame.io enterprise setup process" }),
      product: t({ message: "Sign up and upload", comment: "Product comparison value — simple setup" }),
      note: t({ message: "Under 60 seconds or your money back.", comment: "Humorous note about fast setup" }),
    },
  ];
}

const teamSizes = [3, 5, 10, 20];

function getSavingsCommentary(): Record<number, string> {
  return {
    3: t({ message: "That's a lot of burritos.", comment: "Humorous savings commentary for 3-person team" }),
    5: t({ message: "A nice weekend trip for the team.", comment: "Savings commentary for 5-person team" }),
    10: t({ message: "A used car. A really used car.", comment: "Humorous savings commentary for 10-person team" }),
    20: t({ message: "You could hire another freelancer with that.", comment: "Savings commentary for 20-person team" }),
  };
}

export default function CompareFrameio() {
  const comparisonRows = getComparisonRows();
  const savingsCommentary = getSavingsCommentary();

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="px-6 pt-20 pb-24 md:pt-28 md:pb-32 border-b-2 border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[14vw] sm:text-[10vw] md:text-[8vw] font-black leading-[0.85] tracking-tighter uppercase">
            <Trans comment="Hero heading — {PRODUCT_NAME} is the product name, keep untranslated. Frame.io is a competitor name, keep untranslated">
              {PRODUCT_NAME} vs
              <br />
              Frame.io
            </Trans>
          </h1>
          <div className="mt-10 md:mt-14 max-w-2xl">
            <p className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">
              <Trans comment="Hero subheading — bold marketing statement">
                We're not better.
                <br />
                We're cheaper and faster.
                <br />
                <span className="text-[var(--foreground-muted)]">
                  That might be better.
                </span>
              </Trans>
            </p>
            <p className="mt-6 text-lg text-[var(--foreground-muted)] font-medium max-w-lg">
              <Trans comment="Hero description — Frame.io is a competitor name, keep untranslated. {PRODUCT_NAME} is the product name, keep untranslated">
                Frame.io is a great product built for enterprise teams with
                enterprise budgets. {PRODUCT_NAME} is a scrappy little tool that does the
                important stuff for {formatPrice(PRICING.basic.price)}/month flat. No per-seat math. No PhD in
                procurement required.
              </Trans>
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-side comparison table */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[var(--border)] bg-[var(--surface-alt)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16 text-center">
            <Trans comment="Section heading for comparison table">
              FEATURE
              <br />
              FIGHT.
            </Trans>
          </h2>

          <div className="border-2 border-[var(--border)] shadow-[8px_8px_0px_0px_var(--shadow-color)] bg-[var(--background)]">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)]">
              <div className="p-4 md:p-6 font-black uppercase tracking-wider text-sm">
                <Trans comment="Table column header">Feature</Trans>
              </div>
              <div className="p-4 md:p-6 font-black uppercase tracking-wider text-sm border-l-2 border-[var(--border)]">
                <Trans comment="Table column header — Frame.io is a competitor name, keep untranslated">Frame.io</Trans>
              </div>
              <div className="p-4 md:p-6 font-black uppercase tracking-wider text-sm border-l-2 border-[var(--border)] text-[var(--accent-light)]">
                <Trans comment="Table column header — {PRODUCT_NAME} is the product name, keep untranslated">{PRODUCT_NAME}</Trans>
              </div>
            </div>

            {/* Data rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 ${i < comparisonRows.length - 1 ? "border-b-2 border-[var(--border)]" : ""}`}
              >
                <div className="p-4 md:p-6 flex flex-col justify-center">
                  <span className="font-black uppercase tracking-tight text-lg">
                    {row.feature}
                  </span>
                  <span className="text-xs text-[var(--foreground-muted)] mt-1 hidden md:block">
                    {row.note}
                  </span>
                </div>
                <div className="p-4 md:p-6 border-l-2 border-[var(--border)] flex items-center text-[var(--foreground-muted)] font-medium">
                  {row.frameio}
                </div>
                <div className="p-4 md:p-6 border-l-2 border-[var(--border)] flex items-center font-bold text-[var(--accent)]">
                  {row.product}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[var(--foreground-muted)] mt-6 md:hidden">
            <Trans comment="Pricing disclaimer — Frame.io is a competitor name, keep untranslated. Currency values are translatable">
              * Frame.io pricing based on their Team plan at $19/user/month.
            </Trans>
          </p>
        </div>
      </section>

      {/* Cost savings calculator */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 text-center">
            <Trans comment="Section heading for cost calculator">
              DO THE
              <br />
              MATH.
            </Trans>
          </h2>
          <p className="text-center text-lg text-[var(--foreground-muted)] font-medium mb-16 max-w-lg mx-auto">
            <Trans comment="Cost calculator description — Frame.io is a competitor name, keep untranslated. {PRODUCT_NAME} is the product name, keep untranslated. Currency values are translatable">
              Frame.io charges $19 per user per month. {PRODUCT_NAME} charges {formatPrice(PRICING.basic.price)} per month.
              Not per user. Just {formatPrice(PRICING.basic.price)}. Here's what that looks like.
            </Trans>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamSizes.map((size) => {
              const frameioMonthly = FRAMEIO_PRICE_PER_USER * size;

              return (
                <div
                  key={size}
                  className="border-2 border-[var(--border)] bg-[var(--background)] shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all flex flex-col"
                >
                  <div className="border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)] p-5">
                    <span className="text-4xl font-black">{size}</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--foreground-muted)] ml-2">
                      {size === 1
                        ? <Trans comment="Team size label singular">person</Trans>
                        : <Trans comment="Team size label plural">people</Trans>}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                        <Trans comment="Label — Frame.io is a competitor name, keep untranslated">Frame.io</Trans>
                      </span>
                      <span className="font-black text-[var(--foreground-muted)] line-through">
                        ${frameioMonthly.toLocaleString()}<Trans comment="Per month abbreviation">/mo</Trans>
                      </span>
                    </div>
                    <div className="border-t-2 border-[var(--border-subtle)] pt-4 mt-auto">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
                        <Trans comment="Label — {PRODUCT_NAME} is the product name, keep untranslated">{PRODUCT_NAME}</Trans>
                      </div>
                      <div className="text-3xl font-black text-[var(--accent)]">
                        {formatPrice(PRICING.basic.price)}<span className="text-base"><Trans comment="Per month abbreviation">/mo</Trans></span>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)] mt-2 italic">
                        {savingsCommentary[size]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Honest "who should use what" */}
      <section className="px-6 py-24 md:py-32 border-b-2 border-[var(--border)] bg-[var(--surface-alt)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 text-center">
            <Trans comment="Section heading for honest advice">
              HONEST
              <br />
              ADVICE.
            </Trans>
          </h2>
          <p className="text-center text-lg text-[var(--foreground-muted)] font-medium mb-16 max-w-lg mx-auto">
            <Trans comment="Honest advice intro — Frame.io is a competitor name, keep untranslated">
              We could trash-talk Frame.io but that would be dishonest and also
              they have way more employees than us. Here's the real deal.
            </Trans>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Use Frame.io if... */}
            <div className="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <div className="border-b-2 border-[var(--border)] p-6">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                  <Trans comment="Heading — Frame.io is a competitor name, keep untranslated">Use Frame.io if...</Trans>
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Frame.io advantage — enterprise compliance">
                        You need enterprise compliance docs (SOC 2, etc.) for your
                        procurement team to approve anything
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Frame.io advantage — Adobe is a brand name, keep untranslated">
                        You're deeply embedded in Adobe Premiere and After Effects
                        and need native panel integration
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Frame.io advantage — large team workflows">
                        You have 100+ people with complex multi-stage approval
                        workflows and version trees
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Frame.io advantage — unlimited budget">
                        Budget isn't a concern and you want every feature
                        imaginable, even the ones you'll never use
                      </Trans>
                    </span>
                  </li>
                </ul>
                <p className="text-sm text-[var(--foreground-muted)] mt-6 pt-4 border-t-2 border-[var(--border-subtle)]">
                  <Trans comment="Closing remark for Frame.io section — Frame.io is a competitor name, keep untranslated">
                    Genuinely, Frame.io is solid software. If this is you, go use
                    it. We won't be offended. (Okay maybe a little.)
                  </Trans>
                </p>
              </div>
            </div>

            {/* Use product if... */}
            <div className="border-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)] shadow-[8px_8px_0px_0px_var(--shadow-accent)]">
              <div className="border-b-2 border-[var(--border)] p-6">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--accent-light)]">
                  <Trans comment="Heading — {PRODUCT_NAME} is the product name, keep untranslated">Use {PRODUCT_NAME} if...</Trans>
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — small teams">
                        You're a small-to-mid team that just needs to share cuts
                        and collect feedback without a NASA control panel
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — agencies">
                        You're an agency tired of doing per-seat multiplication
                        every time you onboard a client
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — freelancers">
                        You're a freelancer who just needs to show a cut to a
                        client without making them create yet another account
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — simplicity">
                        You value speed and simplicity over a feature checklist
                        that makes the marketing site look impressive
                      </Trans>
                    </span>
                  </li>
                </ul>
                <p className="text-sm text-[var(--foreground-muted)] mt-6 pt-4 border-t border-[#333]">
                  <Trans comment="Closing remark for product section — Frame.io is a competitor name, keep untranslated. {PRODUCT_NAME} is the product name, keep untranslated">
                    We do less than Frame.io. Proudly. Turns out "upload, share,
                    comment" is 90% of what anyone actually needs.
                  </Trans>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-4">
            <Trans comment="CTA heading">
              START
              <br />
              NOW.
            </Trans>
          </h2>
          <p className="text-xl md:text-2xl text-[var(--foreground-muted)] font-medium mb-12 max-w-md">
            <Trans comment="CTA subtext — currency values are translatable">
              {formatPrice(PRICING.basic.price)}/month. Unlimited seats. No sales call required. No credit card to
              start.
            </Trans>
          </p>
          <Link
            to="/sign-up"
            className="bg-[var(--surface-strong)] text-[var(--foreground-inverse)] px-12 py-6 border-2 border-[var(--border)] text-2xl font-black uppercase tracking-wider hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-[12px_12px_0px_0px_var(--shadow-accent)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
          >
            <Trans comment="CTA button text — {PRODUCT_NAME} is the product name, keep untranslated">TRY {PRODUCT_NAME} FREE</Trans>
          </Link>
          <p className="text-sm text-[var(--foreground-muted)] mt-6">
            <Trans comment="CTA closing joke">
              Or keep paying per-user. We don't judge.
              <br />
              (We judge a little.)
            </Trans>
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
