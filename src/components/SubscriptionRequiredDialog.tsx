import { useNavigate } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { teamSettingsPath } from "@/lib/routes";

interface SubscriptionRequiredDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriodEnd?: number | null;
}

export function SubscriptionRequiredDialog({
  teamId,
  open,
  onOpenChange,
  currentPeriodEnd,
}: SubscriptionRequiredDialogProps) {
  const navigate = useNavigate({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans comment="Subscription required dialog title">Subscription required</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans comment="Subscription required dialog description">An active subscription is required for this action.</Trans>
            {currentPeriodEnd && (
              <>
                {" "}
                <Trans comment="Subscription end date in dialog">
                  Subscription expires {new Date(currentPeriodEnd * 1000).toLocaleDateString()}.
                </Trans>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <Trans comment="Cancel button in dialog">Cancel</Trans>
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              void navigate({ to: teamSettingsPath(teamId) });
            }}
          >
            <Trans comment="Manage subscription button">Manage subscription</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
