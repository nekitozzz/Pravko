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

interface UpgradeRequestDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeRequestDialog({ teamId, open, onOpenChange }: UpgradeRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await api.billing.requestUpgrade(teamId, { message: message.trim() });
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error("Failed to send upgrade request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSent(false);
      setMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {sent ? (
          <div className="py-8 text-center">
            <p className="text-lg font-bold text-[#2d5a2d]">
              <Trans comment="Upgrade request sent success message">Your request has been sent. We'll get back to you soon!</Trans>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                <Trans comment="Upgrade request dialog title">Request a plan upgrade</Trans>
              </DialogTitle>
              <DialogDescription>
                <Trans comment="Upgrade request dialog description">Tell us about your needs and we'll find the right plan for you.</Trans>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder={t({ message: "Describe your needs...", comment: "Upgrade request textarea placeholder" })}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                <Trans comment="Cancel button in dialog">Cancel</Trans>
              </Button>
              <Button type="submit" disabled={!message.trim() || isLoading}>
                {isLoading
                  ? <Trans comment="Upgrade request submit loading state">Sending...</Trans>
                  : <Trans comment="Upgrade request submit button">Send request</Trans>}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
