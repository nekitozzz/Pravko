import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { MarketingLayout } from "@/components/MarketingLayout";
import { PRODUCT_NAME, PRICING, formatPrice } from "@/lib/product";

const WIPSTER_PRICE_PER_USER = 15;

function getComparisonRows() {
  return [
    {
      feature: t({ message: "Pricing", comment: "Comparison table row label" }),
      wipster: t({ message: "Per-user/month", comment: "Wipster pricing model" }),
      product: t({ message: `${formatPrice(PRICING.basic.price)}/month. Total.`, comment: "Product comparison value — currency string" }),
      note: t({ message: "Your accountant will love you.", comment: "Humorous note about simple pricing" }),
    },
    {
      feature: t({ message: "Self-hosting", comment: "Comparison table row label" }),
      wipster: t({ message: "No", comment: "Wipster has no self-hosting" }),
      product: t({ message: "Yes", comment: "Product supports self-hosting" }),
      note: t({ message: "Your data, your servers.", comment: "Note about self-hosting capability" }),
    },
    {
      feature: t({ message: "Speed", comment: "Comparison table row label" }),
      wipster: t({ message: "Solid, no complaints", comment: "Wipster speed assessment" }),
      product: t({ message: "Instant Mux playback", comment: "Product comparison value — Mux is a video platform name" }),
      note: t({ message: "We're unreasonably competitive about this.", comment: "Humorous note about speed obsession" }),
    },
    {
      feature: t({ message: "Sharing", comment: "Comparison table row label — how sharing works" }),
      wipster: t({ message: "Invite to workspace", comment: "Wipster sharing model" }),
      product: t({ message: "Just a link", comment: "Product comparison value — sharing via link" }),
      note: t({ message: "Your clients don't want another login.", comment: "Note about simple sharing" }),
    },
    {
      feature: t({ message: "Simplicity", comment: "Comparison table row label" }),
      wipster: t({ message: "Full-featured platform", comment: "Wipster feature scope" }),
      product: t({ message: "Fewer features (on purpose)", comment: "Product comparison value — intentional simplicity" }),
      note: t({ message: "We call this a feature, not a bug.", comment: "Humorous note about intentional simplicity" }),
    },
    {
      feature: t({ message: "Approvals", comment: "Comparison table row label — approval workflows" }),
      wipster: t({ message: "Built-in workflows", comment: "Wipster approval feature" }),
      product: t({ message: "Comments + thumbs up", comment: "Product comparison value — simple approval" }),
      note: t({ message: "If that's not enough, we respect that.", comment: "Honest note about approval limitations" }),
    },
  ];
}

const teamSizes = [3, 5, 10, 25];

function getSavingsCommentary(): Record<number, string> {
  return {
    3: t({ message: "A very nice dinner for the team.", comment: "Savings commentary for 3-person team" }),
    5: t({ message: "That's a new camera lens.", comment: "Savings commentary for 5-person team" }),
    10: t({ message: "A weekend at a cabin to celebrate shipping.", comment: "Savings commentary for 10-person team" }),
    25: t({ message: "Genuinely, that's a lot of money.", comment: "Savings commentary for 25-person team" }),
  };
}

export default function CompareWipster() {
  const comparisonRows = getComparisonRows();
  const savingsCommentary = getSavingsCommentary();

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="px-6 pt-20 pb-24 md:pt-28 md:pb-32 border-b-2 border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[14vw] sm:text-[10vw] md:text-[8vw] font-black leading-[0.85] tracking-tighter uppercase">
            <Trans comment="Hero heading — {PRODUCT_NAME} is the product name, keep untranslated. Wipster is a competitor name, keep untranslated">
              {PRODUCT_NAME} vs
              <br />
              Wipster
            </Trans>
          </h1>
          <div className="mt-10 md:mt-14 max-w-2xl">
            <p className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">
              <Trans comment="Hero subheading — humorous marketing statement">
                Two video review tools
                <br />
                walk into a bar.
                <br />
                <span className="text-[var(--foreground-muted)]">
                  One costs less. That's the whole joke.
                </span>
              </Trans>
            </p>
            <p className="mt-6 text-lg text-[var(--foreground-muted)] font-medium max-w-lg">
              <Trans comment="Hero description — Wipster is a competitor name, keep untranslated. {PRODUCT_NAME} is the product name, keep untranslated">
                Wipster is a solid tool with real approval workflows and a proper
                feature set. {PRODUCT_NAME} is smaller, cheaper, and self-hostable. We do less
                for less money, and that's the whole pitch.
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
              SIDE BY
              <br />
              SIDE.
            </Trans>
          </h2>

          <div className="border-2 border-[var(--border)] shadow-[8px_8px_0px_0px_var(--shadow-color)] bg-[var(--background)]">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)]">
              <div className="p-4 md:p-6 font-black uppercase tracking-wider text-sm">
                <Trans comment="Table column header">Feature</Trans>
              </div>
              <div className="p-4 md:p-6 font-black uppercase tracking-wider text-sm border-l-2 border-[var(--border)]">
                <Trans comment="Table column header — Wipster is a competitor name, keep untranslated">Wipster</Trans>
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
                  {row.wipster}
                </div>
                <div className="p-4 md:p-6 border-l-2 border-[var(--border)] flex items-center font-bold text-[var(--accent)]">
                  {row.product}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[var(--foreground-muted)] mt-6 md:hidden">
            <Trans comment="Pricing disclaimer — Wipster is a competitor name, keep untranslated">
              * Wipster pricing based on their per-user model. Actual pricing may
              vary by plan.
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
            <Trans comment="Cost calculator description — Wipster is a competitor name, keep untranslated. {PRODUCT_NAME} is the product name, keep untranslated. Currency values are translatable">
              Wipster charges per user. {PRODUCT_NAME} charges {formatPrice(PRICING.basic.price)} per month total. Not per
              user. Just {formatPrice(PRICING.basic.price)}. The math gets increasingly silly as your team grows.
            </Trans>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamSizes.map((size) => {
              const wipsterMonthly = WIPSTER_PRICE_PER_USER * size;

              return (
                <div
                  key={size}
                  className="border-2 border-[var(--border)] bg-[var(--background)] shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all flex flex-col"
                >
                  <div className="border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)] p-5">
                    <span className="text-4xl font-black">{size}</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-[var(--foreground-muted)] ml-2">
                      <Trans comment="Team size label plural">people</Trans>
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                        <Trans comment="Label — Wipster is a competitor name, keep untranslated">Wipster</Trans>
                      </span>
                      <span className="font-black text-[var(--foreground-muted)] line-through">
                        ${wipsterMonthly.toLocaleString()}<Trans comment="Per month abbreviation">/mo</Trans>
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
            <Trans comment="Honest advice intro — Wipster is a competitor name, keep untranslated">
              Wipster is genuinely good software built by people who care about
              video review. We just think there's room for something simpler. Here
              are the facts.
            </Trans>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Use Wipster if... */}
            <div className="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <div className="border-b-2 border-[var(--border)] p-6">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                  <Trans comment="Heading — Wipster is a competitor name, keep untranslated">Use Wipster if...</Trans>
                </h3>
              </div>
              <div className="p-6">
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Wipster advantage — approval workflows">
                        You need built-in approval workflows with multiple review
                        stages, status tracking, and the whole production pipeline
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Wipster advantage — established teams">
                        You're an established media team that's already invested in
                        a full review ecosystem and switching costs are real
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Wipster advantage — deep review features">
                        You want deep review stages with version comparisons,
                        granular permissions, and structured feedback rounds
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Wipster advantage — budget not a concern">
                        Per-user pricing is fine because your budget is already
                        approved and nobody's counting
                      </Trans>
                    </span>
                  </li>
                </ul>
                <p className="text-sm text-[var(--foreground-muted)] mt-6 pt-4 border-t-2 border-[var(--border-subtle)]">
                  <Trans comment="Closing remark for Wipster section — Wipster is a competitor name, keep untranslated">
                    Seriously, Wipster is good. If this is you, go use it. We'll
                    be here if you change your mind later.
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
                      <Trans comment="Product advantage — small teams and agencies">
                        You're a small team or agency that just needs to share cuts
                        and collect feedback without a 45-minute onboarding
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — anti per-seat pricing">
                        You hate per-seat pricing with a passion that concerns your
                        friends and family
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — link-based review">
                        You want clients to review with just a link, no account
                        creation, no "please check your email" nonsense
                      </Trans>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">
                      --
                    </span>
                    <span className="font-medium">
                      <Trans comment="Product advantage — self-hosting and data control">
                        You want to self-host and keep full control over your
                        data and video infrastructure
                      </Trans>
                    </span>
                  </li>
                </ul>
                <p className="text-sm text-[var(--foreground-muted)] mt-6 pt-4 border-t border-[#333]">
                  <Trans comment="Closing remark for product section — Wipster is a competitor name, keep untranslated. {PRODUCT_NAME} is the product name, keep untranslated">
                    We do less than Wipster. Proudly. Upload, share, comment. Go
                    home. That's 90% of what anyone actually needs.
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
              {formatPrice(PRICING.basic.price)}/month. Unlimited seats. Self-hostable. No per-user nonsense.
            </Trans>
          </p>
          <Link
            to="/sign-up"
            className="bg-[var(--surface-strong)] text-[var(--foreground-inverse)] px-12 py-6 border-2 border-[var(--border)] text-2xl font-black uppercase tracking-wider hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-[12px_12px_0px_0px_var(--shadow-accent)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
          >
            <Trans comment="CTA button text">START FREE TRIAL</Trans>
          </Link>
          <p className="text-sm text-[var(--foreground-muted)] mt-6">
            <Trans comment="CTA closing line">
              No credit card required. No per-seat gotchas.
              <br />
              Just video review that doesn't require a spreadsheet to budget.
            </Trans>
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
