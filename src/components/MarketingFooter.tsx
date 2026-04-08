import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export function MarketingFooter() {
  return (
    <footer className="border-t-2 border-[#1a1a1a] px-6 py-16 bg-[#1a1a1a] text-[#f0f0e8]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-16">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#888] mb-4">
              <Trans comment="Footer section heading: product links">Product</Trans>
            </h3>
            <ul className="space-y-3 text-sm font-bold">
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to pricing page">Pricing</Trans>
                </Link>
              </li>
              <li>
                <Link
                  to="/sign-up"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to start free trial">Start free trial</Trans>
                </Link>
              </li>
              <li>
                <Link
                  to="/sign-in"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to sign in">Sign in</Trans>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#888] mb-4">
              <Trans comment="Footer section heading: comparison links">Compare</Trans>
            </h3>
            <ul className="space-y-3 text-sm font-bold">
              <li>
                <Link
                  to="/compare/frameio"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to compare our product with Frame.io. {PRODUCT_NAME} is the product name, keep untranslated. Frame.io is a competitor name, keep untranslated">{PRODUCT_NAME} vs Frame.io</Trans>
                </Link>
              </li>
              <li>
                <Link
                  to="/compare/wipster"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to compare our product with Wipster. {PRODUCT_NAME} is the product name, keep untranslated. Wipster is a competitor name, keep untranslated">{PRODUCT_NAME} vs Wipster</Trans>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#888] mb-4">
              <Trans comment="Footer section heading: use case links">Use cases</Trans>
            </h3>
            <ul className="space-y-3 text-sm font-bold">
              <li>
                <Link
                  to="/for/video-editors"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to video editors use case page">For video editors</Trans>
                </Link>
              </li>
              <li>
                <Link
                  to="/for/agencies"
                  className="hover:text-[#7cb87c] transition-colors"
                >
                  <Trans comment="Footer link to agencies use case page">For agencies</Trans>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#333] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-black text-3xl tracking-tighter">{PRODUCT_NAME}</span>
          <span className="text-sm text-[#888]">
            <Trans comment="Product tagline in footer">Video review for creative teams.</Trans>
          </span>
        </div>
      </div>
    </footer>
  );
}
