import { Link, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export const Route = createFileRoute("/4")({
  component: LandingTerminal,
});

/**
 * Design 4 — "Terminal / Hacker"
 * Green-on-black terminal aesthetic. Monospace everything.
 * ASCII art, command-line prompts, blinking cursor.
 */
export default function LandingTerminal() {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-[#33ff33] selection:bg-[#33ff33] selection:text-[#0a0a0a]"
      style={{ fontFamily: "Geist Mono, Menlo, Consolas, monospace" }}
    >
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)",
        }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#33ff33]/20 px-6 py-3 flex justify-between items-center text-sm">
        <span className="text-[#33ff33]">
          <span className="text-[#33ff33]/40">user@</span>{PRODUCT_NAME}
          <span className="text-[#33ff33]/40">:~$</span>
        </span>
        <div className="flex gap-6 items-center">
          <Link to="/sign-in" className="text-[#33ff33]/50 hover:text-[#33ff33] transition-colors">
            <Trans comment="Nav: login">login</Trans>
          </Link>
          <Link
            to="/sign-up"
            className="border border-[#33ff33] px-4 py-1 hover:bg-[#33ff33] hover:text-[#0a0a0a] transition-all"
          >
            <Trans comment="Nav: signup">./signup</Trans>
          </Link>
        </div>
      </nav>

      {/* Hero — terminal prompt */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* ASCII art title */}
          <pre className="text-[#33ff33]/20 text-[8px] sm:text-xs md:text-sm leading-tight mb-12 overflow-x-auto">
{`
 ██████╗ ██████╗  █████╗ ██╗   ██╗██╗  ██╗ ██████╗
 ██╔══██╗██╔══██╗██╔══██╗██║   ██║██║ ██╔╝██╔═══██╗
 ██████╔╝██████╔╝███████║██║   ██║█████╔╝ ██║   ██║
 ██╔═══╝ ██╔══██╗██╔══██║╚██╗ ██╔╝██╔═██╗ ██║   ██║
 ██║     ██║  ██║██║  ██║ ╚████╔╝ ██║  ██╗╚██████╔╝
 ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝
`}
          </pre>

          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
              <span>cat /etc/motd</span>
            </div>
            <div className="pl-4 text-[#33ff33]/70 leading-relaxed">
              <p className="text-2xl md:text-4xl font-bold text-[#33ff33] mb-4">
                <Trans comment="Terminal hero">Video review for creative teams.</Trans>
              </p>
              <p className="text-[#33ff33]/50">
                <Trans comment="Terminal tagline">
                  Frame-accurate comments. Unlimited seats. $5/month flat.
                  Self-hosted. No bloat.
                </Trans>
              </p>
            </div>

            <div className="flex items-start mt-8">
              <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
              <span>
                {PRODUCT_NAME} --start
                <span className="inline-block w-2 h-5 bg-[#33ff33] ml-1 animate-pulse" />
              </span>
            </div>

            <div className="mt-6 flex gap-4">
              <Link
                to="/sign-up"
                className="border border-[#33ff33] px-8 py-3 font-bold hover:bg-[#33ff33] hover:text-[#0a0a0a] transition-all"
              >
                <Trans comment="CTA: start">[ENTER] Start Free Trial</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature list — terminal output */}
      <section className="border-y border-[#33ff33]/20 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start mb-6">
            <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
            <span>{PRODUCT_NAME} --features</span>
          </div>

          <div className="pl-4 space-y-1">
            <div className="text-[#33ff33]/30 mb-4">
              {'┌──────────────────────────────────────────────────┐'}
            </div>

            {[
              { flag: "--frame-accurate", desc: "Comments on exact frames, not approximate timestamps" },
              { flag: "--unlimited-seats", desc: "Invite your whole team. No per-seat pricing" },
              { flag: "--self-hosted", desc: "Your servers, your data. Full control" },
              { flag: "--fast", desc: "0.3s average response time. No loading spinners" },
              { flag: "--share", desc: "Send a link. No account required for reviewers" },
              { flag: "--nle-export", desc: "Export to Premiere, Resolve, Final Cut" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 py-2">
                <span className="text-[#33ff33]/30 shrink-0">│</span>
                <span className="text-yellow-400 shrink-0 w-44">{f.flag}</span>
                <span className="text-[#33ff33]/60">{f.desc}</span>
              </div>
            ))}

            <div className="text-[#33ff33]/30 mt-4">
              {'└──────────────────────────────────────────────────┘'}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — piped commands */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start mb-6">
            <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
            <span>{PRODUCT_NAME} --how-it-works</span>
          </div>

          <div className="pl-4 space-y-8">
            {[
              {
                step: "STEP 1",
                cmd: "upload video.mp4",
                output: "Processing... done (2.3s)\nVideo ready for review.",
              },
              {
                step: "STEP 2",
                cmd: "share --generate-link",
                output: "Link generated: https://pravko.ru/s/abc123\nNo account required for reviewer.",
              },
              {
                step: "STEP 3",
                cmd: "review --frame-accurate",
                output: 'Comment at 01:23:15 — "Fix the color grade here"\nComment at 02:45:03 — "Trim 2 frames"\nExporting to Premiere Pro... done.',
              },
            ].map((s) => (
              <div key={s.step} className="border border-[#33ff33]/10 bg-[#0f0f0f]">
                <div className="border-b border-[#33ff33]/10 px-4 py-2 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-[#33ff33]/30">{s.step}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start">
                    <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
                    <span>{PRODUCT_NAME} {s.cmd}</span>
                  </div>
                  <pre className="text-[#33ff33]/50 text-sm whitespace-pre-wrap pl-4">{s.output}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison — diff format */}
      <section className="border-y border-[#33ff33]/20 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start mb-6">
            <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
            <span>diff frameio.conf {PRODUCT_NAME.toLowerCase()}.conf</span>
          </div>

          <div className="pl-4 font-mono text-sm space-y-1">
            <div className="text-[#33ff33]/30">--- frameio.conf</div>
            <div className="text-[#33ff33]/30">+++ {PRODUCT_NAME.toLowerCase()}.conf</div>
            <div className="text-[#33ff33]/30 mt-2">@@ pricing @@</div>
            <div className="text-red-400">- price_per_user = $19/month</div>
            <div className="text-red-400">- total_5_users = $1,140/year</div>
            <div className="text-[#33ff33]">+ price_flat = $5/month</div>
            <div className="text-[#33ff33]">+ total_5_users = $60/year</div>
            <div className="text-[#33ff33]/30 mt-2">@@ features @@</div>
            <div className="text-red-400">- seats = per_user</div>
            <div className="text-red-400">- hosting = cloud_only</div>
            <div className="text-red-400">- complexity = enterprise</div>
            <div className="text-[#33ff33]">+ seats = unlimited</div>
            <div className="text-[#33ff33]">+ hosting = self_hosted | cloud</div>
            <div className="text-[#33ff33]">+ complexity = minimal</div>
            <div className="text-[#33ff33]/30 mt-4">@@ savings @@</div>
            <div className="text-[#33ff33]">+ annual_savings = $1,080</div>
            <div className="text-[#33ff33]">+ status = 🎉</div>
          </div>
        </div>
      </section>

      {/* Pricing — package manager style */}
      <section id="pricing" className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start mb-8">
            <span className="text-[#33ff33]/40 mr-2 shrink-0">$</span>
            <span>{PRODUCT_NAME} --pricing</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
            {/* Basic */}
            <div className="border border-[#33ff33]/20 p-6 hover:border-[#33ff33]/40 transition-colors">
              <div className="text-yellow-400 text-sm mb-2">package: basic</div>
              <div className="text-3xl font-bold mb-1">$5<span className="text-sm text-[#33ff33]/40">/mo</span></div>
              <div className="text-[#33ff33]/40 text-sm mb-6">install size: 100GB</div>
              <div className="text-sm text-[#33ff33]/60 space-y-1 mb-8">
                <div>  dependencies:</div>
                <div>    - unlimited-seats</div>
                <div>    - unlimited-projects</div>
                <div>    - frame-comments</div>
                <div>    - nle-export</div>
              </div>
              <Link
                to="/sign-up"
                className="block text-center border border-[#33ff33]/40 py-3 hover:bg-[#33ff33] hover:text-[#0a0a0a] transition-all"
              >
                <Trans comment="Install basic">$ install basic</Trans>
              </Link>
            </div>

            {/* Pro */}
            <div className="border border-[#33ff33] p-6 relative">
              <div className="absolute -top-2.5 right-4 bg-[#33ff33] text-[#0a0a0a] text-xs font-bold px-2 py-0.5">
                RECOMMENDED
              </div>
              <div className="text-yellow-400 text-sm mb-2">package: pro</div>
              <div className="text-3xl font-bold mb-1">$25<span className="text-sm text-[#33ff33]/40">/mo</span></div>
              <div className="text-[#33ff33]/40 text-sm mb-6">install size: 1TB</div>
              <div className="text-sm text-[#33ff33]/60 space-y-1 mb-8">
                <div>  dependencies:</div>
                <div>    - basic (all)</div>
                <div>    - storage-1tb</div>
                <div>    - priority-support</div>
                <div>    - custom-branding</div>
              </div>
              <Link
                to="/sign-up"
                className="block text-center bg-[#33ff33] text-[#0a0a0a] py-3 font-bold hover:bg-[#66ff66] transition-colors"
              >
                <Trans comment="Install pro">$ install pro</Trans>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-[#33ff33]/40">$ </span>
            <Trans comment="Final CTA">
              {PRODUCT_NAME} --start
            </Trans>
            <span className="inline-block w-3 h-8 bg-[#33ff33] ml-2 animate-pulse" />
          </div>
          <p className="text-[#33ff33]/40 mb-8">
            <Trans comment="CTA subtext">Ready when you are. Hit enter to begin.</Trans>
          </p>
          <Link
            to="/sign-up"
            className="inline-block bg-[#33ff33] text-[#0a0a0a] px-12 py-4 text-lg font-bold hover:bg-[#66ff66] transition-colors"
          >
            <Trans comment="Create team">[ENTER] Create Your Team</Trans>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#33ff33]/20 px-6 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-[#33ff33]/30">
          <span>
            <span className="text-[#33ff33]/20">user@</span>{PRODUCT_NAME}
          </span>
          <span>
            <Trans comment="Footer tagline">video review // creative teams</Trans>
          </span>
        </div>
      </footer>
    </div>
  );
}
