"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teamHomePath } from "@/lib/routes";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const createdTeam = await api.teams.create({ name: name.trim() });
      onOpenChange(false);
      setName("");
      navigate({ to: teamHomePath(createdTeam.teamId) });
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle><Trans comment="Dialog title for creating a new team">Create a new team</Trans></DialogTitle>
            <DialogDescription>
              <Trans comment="Description in create team dialog">Teams let you collaborate on video projects with others.</Trans>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t({message: "Team name", comment: "Placeholder for team name input"})}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <Trans comment="Cancel button in dialog">Cancel</Trans>
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? <Trans comment="Loading state for create team button">Creating...</Trans> : <Trans comment="Submit button to create a new team">Create team</Trans>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
