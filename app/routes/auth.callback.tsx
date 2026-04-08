import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useHandleSignInCallback } from "@logto/react";
import { Trans } from "@lingui/react/macro";
import { AuthShell } from "./auth/-layout";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();

  const { isLoading } = useHandleSignInCallback(() => {
    const saved = sessionStorage.getItem("pravko_post_auth_redirect");
    sessionStorage.removeItem("pravko_post_auth_redirect");
    navigate({ to: saved || "/dashboard" });
  });

  if (isLoading) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-12 h-12 border-2 border-[#1a1a1a] bg-[#1a1a1a] flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#f0f0e8]" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-2">
              <Trans comment="Callback page heading while verifying auth">Signing in</Trans>
            </h2>
            <p className="text-sm text-[#888] font-mono">
              <Trans comment="Status while processing sign-in callback">Verifying your credentials...</Trans>
            </p>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="w-2 h-2 bg-[#2d5a2d] animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-[#2d5a2d] animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "200ms" }} />
            <span className="w-2 h-2 bg-[#2d5a2d] animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </AuthShell>
    );
  }

  return null;
}
