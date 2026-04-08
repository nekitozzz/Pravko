import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { PRODUCT_NAME } from "@/lib/product";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-200 ${scrolled ? "bg-[#f0f0e8] text-[#1a1a1a] border-b-2 border-[#1a1a1a]" : "bg-[#f0f0e8] text-[#1a1a1a] border-b-2 border-[#1a1a1a]"}`}
    >
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-black tracking-tighter">
          {PRODUCT_NAME}
        </Link>
      </div>
      <div className="flex gap-6 items-center text-sm font-bold uppercase tracking-wide">
        <Link
          to="/pricing"
          className="hover:underline underline-offset-4 hidden sm:block"
        >
          <Trans comment="Navigation link to pricing page">Pricing</Trans>
        </Link>
        <Link
          to="/compare/frameio"
          className="hover:underline underline-offset-4 hidden sm:block"
        >
          <Trans comment="Navigation link to comparison page">Compare</Trans>
        </Link>
        <Link to="/sign-in" className="hover:underline underline-offset-4">
          <Trans comment="Navigation link to sign in">Log in</Trans>
        </Link>
        <Link
          to="/sign-up"
          className="px-4 py-2 border-2 border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0f0e8] transition-colors"
        >
          <Trans comment="Navigation CTA button to start free trial">Start</Trans>
        </Link>
      </div>
    </nav>
  );
}
