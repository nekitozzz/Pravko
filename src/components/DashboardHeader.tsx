import { Link } from "@tanstack/react-router";
import { useLogto } from "@logto/react";
import { Moon, Sun, LogOut, Settings } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeToggle";
import React from "react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useRoutePrewarmIntent } from "@/lib/useRoutePrewarmIntent";
import { prewarmDashboardIndex } from "../../app/routes/dashboard/-index.data";
import { PRODUCT_NAME } from "@/lib/product";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

function ThemeToggleButton() {
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

function UserMenu() {
  const { signOut, getIdTokenClaims } = useLogto();
  const [claims, setClaims] = React.useState<{ name?: string; email?: string; picture?: string } | null>(null);
  React.useEffect(() => {
    getIdTokenClaims().then((c) => setClaims(c ?? null));
  }, [getIdTokenClaims]);
  const name = claims?.name ?? claims?.email ?? "User";
  const avatarUrl = claims?.picture;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5a2d] cursor-pointer hover:opacity-80 transition-opacity"
          title={t({message: "Account menu", comment: "Tooltip for user avatar menu button"})}
          aria-label={t({message: "Account menu", comment: "Aria label for user avatar menu button"})}
        >
          <Avatar className="h-8 w-8 rounded-none border-2 border-[#1a1a1a]">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="rounded-none text-xs font-bold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/dashboard/profile">
            <Settings className="mr-2 h-4 w-4" />
            <Trans comment="Menu action to open profile settings">Profile settings</Trans>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void signOut(window.location.origin)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <Trans comment="Menu action to sign out of account">Sign out</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type PathSegment = {
  label: React.ReactNode;
  href?: string;
  prewarmIntentHandlers?: ReturnType<typeof useRoutePrewarmIntent>;
};

export function DashboardHeader({
  children,
  paths = [],
}: {
  children?: React.ReactNode;
  paths?: PathSegment[];
}) {
  const prewarmHomeIntentHandlers = useRoutePrewarmIntent(() =>
    prewarmDashboardIndex(),
  );

  return (
    <header className="flex-shrink-0 border-b-2 border-[#1a1a1a] bg-[#f0f0e8] grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center px-4 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-xl font-black tracking-tighter text-[#1a1a1a] min-w-0 h-11 sm:h-14">
        <Link
          to="/dashboard"
          preload="intent"
          className="hover:text-[#2d5a2d] transition-colors mr-2 flex-shrink-0"
          {...prewarmHomeIntentHandlers}
        >
          {PRODUCT_NAME}
        </Link>
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const isIntermediate = paths.length >= 2 && !isLast;
          return (
          <div key={index} className={`${isIntermediate ? 'hidden sm:flex' : 'flex'} items-center min-w-0 ${isLast ? 'flex-1' : 'flex-shrink-0'}`}>
            <span className="text-[#888] mr-2 flex-shrink-0">/</span>
            {path.href ? (
              <Link
                to={path.href}
                preload="intent"
                className={`hover:text-[#2d5a2d] transition-colors mr-2 ${isLast ? 'truncate' : 'whitespace-nowrap'}`}
                {...path.prewarmIntentHandlers}
              >
                {path.label}
              </Link>
            ) : (
              <div className={`flex items-center gap-3 ${isLast ? 'truncate' : 'whitespace-nowrap'}`}>
                {path.label}
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* User controls — pinned top-right */}
      <div className="row-start-1 col-start-2 sm:col-start-3 flex items-center gap-4 pl-4 border-l-2 border-[#1a1a1a]/10 h-8">
        <ThemeToggleButton />
        <UserMenu />
      </div>

      {/* Children — second row on mobile, middle column on desktop */}
      {children && (
        <div className="col-span-full pb-2 sm:pb-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 flex items-center gap-2 sm:gap-3 sm:justify-end sm:h-14 sm:pl-4 min-w-0">
          {children}
        </div>
      )}
    </header>
  );
}
