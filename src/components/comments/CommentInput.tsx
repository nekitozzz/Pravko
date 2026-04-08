"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/utils";
import { Send, X } from "lucide-react";
import { t } from "@lingui/core/macro";

interface CommentInputProps {
  videoId: string;
  timestampSeconds: number;
  parentId?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  showTimestamp?: boolean;
  variant?: "default" | "seamless";
  disabled?: boolean;
  onDisabledClick?: () => void;
}

export function CommentInput({
  videoId,
  timestampSeconds,
  parentId,
  onSubmit,
  onCancel,
  autoFocus = false,
  placeholder,
  showTimestamp = false,
  variant = "default",
  disabled = false,
  onDisabledClick,
}: CommentInputProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const defaultPlaceholder = disabled
    ? t({message: "Subscription required to comment", comment: "Placeholder when comment input is disabled due to subscription"})
    : showTimestamp
      ? t`Comment at ${formatTimestamp(timestampSeconds)}...`
      : t({message: "Add a comment...", comment: "Placeholder for comment input"});
  const finalPlaceholder = placeholder || defaultPlaceholder;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const submitComment = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      await api.comments.create(videoId, {
        text: text.trim(),
        timestampSeconds,
        parentId,
      });
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      setText("");
      onSubmit?.();
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitComment();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      e.preventDefault();
      void submitComment();
    }
    if (e.key === "Escape") {
      onCancel?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === "seamless"
          ? "relative w-full bg-[#f0f0e8]"
          : "relative w-full pb-1 pr-1"
      }
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={disabled ? (e) => { e.target.blur(); onDisabledClick?.(); } : undefined}
        onClick={disabled ? () => onDisabledClick?.() : undefined}
        placeholder={finalPlaceholder}
        autoFocus={autoFocus}
        readOnly={disabled}
        className={`${
          variant === "seamless"
            ? "block w-full max-h-64 min-h-[100px] bg-transparent border-0 focus:ring-0 resize-none px-4 pt-4 pb-12 text-sm leading-relaxed text-[#1a1a1a] placeholder:text-[#888] font-sans outline-none transition-all"
            : "block w-full max-h-64 min-h-[100px] bg-[#f0f0e8] border-2 border-[#1a1a1a] focus:ring-0 resize-none px-3 pt-3 pb-12 text-sm leading-relaxed text-[#1a1a1a] placeholder:text-[#888] font-sans outline-none shadow-[4px_4px_0px_0px_var(--shadow-color)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all"
        }${disabled ? " opacity-50 cursor-not-allowed" : ""}`}
        rows={3}
      />
      <div
        className={
          variant === "seamless"
            ? "absolute bottom-3 right-3 flex items-center gap-2"
            : "absolute bottom-3 right-3 flex items-center gap-2"
        }
      >
        {onCancel && (
          <Button
            type="button"
            variant={variant === "seamless" ? "ghost" : "outline"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onCancel}
            aria-label={t({message: "Cancel", comment: "Aria label for cancel comment button"})}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="submit"
          variant={variant === "seamless" ? "ghost" : "primary"}
          size="icon"
          className="h-8 w-8 shrink-0 disabled:opacity-50"
          disabled={!text.trim() || isLoading}
          aria-label={t({message: "Send comment", comment: "Aria label for send comment button"})}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
