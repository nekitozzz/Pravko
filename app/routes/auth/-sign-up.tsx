import { useLogto } from "@logto/react";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Trans } from "@lingui/react/macro";
import { UserPlus } from "lucide-react";

export default function SignUpPage() {
  const { signIn, isAuthenticated } = useLogto();
  const search = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const redirectUrl = new URLSearchParams(search).get("redirect_url");
  const callbackUrl = `${window.location.origin}/auth/callback`;

  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace(redirectUrl || "/dashboard");
      return;
    }
    // Logto uses the same signIn flow for both sign-in and sign-up.
    // The user can toggle between them on the Logto hosted UI.
    void signIn(callbackUrl);
  }, [isAuthenticated, signIn, callbackUrl, redirectUrl]);

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="w-12 h-12 border-2 border-[#1a1a1a] bg-[#2d5a2d] flex items-center justify-center">
        <UserPlus className="w-5 h-5 text-[#f0f0e8]" />
      </div>
      <div>
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-2">
          <Trans comment="Sign up page heading">Create account</Trans>
        </h2>
        <p className="text-sm text-[#888] font-mono">
          <Trans comment="Status while redirecting to sign up provider">Redirecting to sign up...</Trans>
        </p>
      </div>
      <div className="flex gap-1.5 items-center">
        <span className="w-2 h-2 bg-[#2d5a2d] animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-[#2d5a2d] animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "200ms" }} />
        <span className="w-2 h-2 bg-[#2d5a2d] animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
}
