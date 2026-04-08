import { type MouseEvent } from "react";
import { t } from "@lingui/core/macro";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type VideoWorkflowStatus =
  | "review"
  | "rework"
  | "done";

export function getVideoWorkflowStatusOptions(): Array<{
  value: VideoWorkflowStatus;
  label: string;
}> {
  return [
    { value: "review", label: t({message: "Review", comment: "Video workflow status: needs review"}) },
    { value: "rework", label: t({message: "Rework", comment: "Video workflow status: needs rework"}) },
    { value: "done", label: t({message: "Done", comment: "Video workflow status: completed"}) },
  ];
}

function workflowStatusLabel(status: VideoWorkflowStatus) {
  const option = getVideoWorkflowStatusOptions().find((item) => item.value === status);
  return option?.label ?? t({message: "Review", comment: "Default video workflow status label"});
}

function workflowStatusDotColor(status: VideoWorkflowStatus) {
  if (status === "done") return "bg-[#2d5a2d]";
  if (status === "rework") return "bg-[#ca8a04]";
  return "bg-[#888]";
}

export type VideoWorkflowStatusControlProps = {
  status: VideoWorkflowStatus;
  onChange: (status: VideoWorkflowStatus) => void;
  size?: "sm" | "lg";
  stopPropagation?: boolean;
  disabled?: boolean;
  className?: string;
};

export function VideoWorkflowStatusControl({
  status,
  onChange,
  size = "sm",
  stopPropagation = false,
  disabled = false,
  className,
}: VideoWorkflowStatusControlProps) {
  const handleClick = (event: MouseEvent) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
  };

  const isLg = size === "lg";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={handleClick}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors border border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40 px-2 py-1",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:text-[#1a1a1a]",
            isLg ? "text-xs text-[#1a1a1a]" : "text-[10px] text-[#888]",
            className,
          )}
          aria-label={t({message: "Update review status", comment: "Aria label for workflow status dropdown"})}
          title={t({message: "Update review status", comment: "Tooltip for workflow status dropdown"})}
        >
          <span className={cn(
            "rounded-full shrink-0",
            workflowStatusDotColor(status),
            isLg ? "h-2.5 w-2.5" : "h-2 w-2",
          )} />
          {workflowStatusLabel(status)}
          <ChevronDown className={cn(
            "opacity-50",
            isLg ? "h-3.5 w-3.5" : "h-3 w-3",
          )} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={handleClick}>
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(nextStatus) => {
            if (disabled) return;
            onChange(nextStatus as VideoWorkflowStatus);
          }}
        >
          {getVideoWorkflowStatusOptions().map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="gap-2">
              <span className={cn(
                "h-2 w-2 rounded-full shrink-0",
                workflowStatusDotColor(option.value),
              )} />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
