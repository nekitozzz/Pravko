import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Moon, Sun } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/product";
import { useTheme } from "@/components/theme/ThemeToggle";

function AuthThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center border-2 border-transparent text-[#888] hover:text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#e8e8e0] transition-colors cursor-pointer"
      title={theme === "dark"
        ? t({message: "Switch to light mode (⌘⇧L)", comment: "Theme toggle button tooltip"})
        : t({message: "Switch to dark mode (⌘⇧L)", comment: "Theme toggle button tooltip"})}
      aria-label={theme === "dark"
        ? t({message: "Switch to light mode", comment: "Accessibility label for theme toggle"})
        : t({message: "Switch to dark mode", comment: "Accessibility label for theme toggle"})}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0e8] relative selection:bg-[#2d5a2d] selection:text-[#f0f0e8]">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--foreground) 1px, transparent 1px),
            linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <AuthThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block group">
            <span className="text-5xl font-black tracking-tighter text-[#1a1a1a] group-hover:text-[#2d5a2d] transition-colors">
              {PRODUCT_NAME}
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[6px_6px_0px_0px_var(--shadow-color)]">
          <div className="border-b-2 border-[#1a1a1a] px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 border-2 border-[#1a1a1a] bg-[#2d5a2d]" />
              <div className="w-2.5 h-2.5 border-2 border-[#1a1a1a] bg-[#7cb87c]" />
              <div className="w-2.5 h-2.5 border-2 border-[#1a1a1a] bg-[#e8e8e0]" />
            </div>
          </div>
          <div className="px-6 py-8">
            {children}
          </div>
        </div>

        {/* Footer tagline */}
        <p className="mt-6 text-center text-xs uppercase tracking-widest font-bold text-[#888]">
          <Trans comment="Product tagline on auth pages">Video collaboration, simplified</Trans>
        </p>
      </div>
    </div>
  );
}

export default AuthShell;
