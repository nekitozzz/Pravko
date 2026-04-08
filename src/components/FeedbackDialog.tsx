import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [type, setType] = useState<"bug" | "feedback">("feedback");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await api.feedback.submit({ type, message: message.trim() });
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setMessage("");
        setType("feedback");
      }, 1500);
    } catch (error) {
      console.error("Failed to send feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSent(false);
      setMessage("");
      setType("feedback");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {sent ? (
          <div className="py-8 text-center">
            <p className="text-lg font-bold text-[#2d5a2d]">
              <Trans comment="Feedback sent success message">Thank you! Your message has been sent.</Trans>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                <Trans comment="Feedback dialog title">Send feedback</Trans>
              </DialogTitle>
              <DialogDescription>
                <Trans comment="Feedback dialog description">Report a bug or share your thoughts.</Trans>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("feedback")}
                  className={`flex-1 px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 border-[#1a1a1a] transition-all ${
                    type === "feedback"
                      ? "bg-[#1a1a1a] text-[#f0f0e8]"
                      : "bg-transparent text-[#1a1a1a] hover:bg-[#e8e8e0]"
                  }`}
                >
                  <Trans comment="Feedback type toggle - feedback">Feedback</Trans>
                </button>
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`flex-1 px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 border-[#1a1a1a] transition-all ${
                    type === "bug"
                      ? "bg-[#1a1a1a] text-[#f0f0e8]"
                      : "bg-transparent text-[#1a1a1a] hover:bg-[#e8e8e0]"
                  }`}
                >
                  <Trans comment="Feedback type toggle - bug">Bug</Trans>
                </button>
              </div>
              <Textarea
                placeholder={t({ message: "Describe your feedback or the bug you encountered...", comment: "Feedback textarea placeholder" })}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                autoFocus
              />
              {SUPPORT_EMAIL && (
                <p className="text-xs text-[#888]">
                  <Trans comment="Direct email fallback text">
                    Or email us directly at{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#2d5a2d] underline underline-offset-2">
                      {SUPPORT_EMAIL}
                    </a>
                  </Trans>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                <Trans comment="Cancel button in dialog">Cancel</Trans>
              </Button>
              <Button type="submit" disabled={!message.trim() || isLoading}>
                {isLoading
                  ? <Trans comment="Feedback submit loading state">Sending...</Trans>
                  : <Trans comment="Feedback submit button">Send</Trans>}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
