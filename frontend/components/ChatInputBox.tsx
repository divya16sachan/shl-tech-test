"use client";

import { useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconSend, IconSquareFilled } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SelectModelDropdown } from "./SelectModelDropdown";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatInputBoxProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text: string) => void;
  isGenerating: boolean;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInputBox({
  input,
  setInput,
  onSend,
  isGenerating,
  onStop,
  disabled = false,
  placeholder = "Describe the role you're hiring for…",
  className,
}: ChatInputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating || disabled) return;

    setInput("");
    onSend(trimmed);
  }, [input, isGenerating, disabled, setInput, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = input.trim().length > 0 && !isGenerating && !disabled;

  return (
    <div className={cn("sticky bottom-0 z-10", className)}>
      {/* Large gradient fade that sits above the input and doesn't block clicks */}
      <div className="absolute bottom-full left-0 right-0 h-32 bg-linear-to-t from-background to-transparent pointer-events-none" />
      
      <div className="bg-background px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card border border-border rounded-3xl p-2 pl-4 gap-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow">
          <div className="flex w-full">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Session complete" : placeholder}
              rows={1}
              disabled={isGenerating || disabled}
              className="flex-1 border-none shadow-none focus-visible:ring-0 resize-none bg-transparent! text-base md:text-[15px] min-h-[24px] max-h-[160px] py-1 px-0"
              aria-label="Message input"
            />

            {isGenerating ? (
              <Button
                size="icon"
                variant="outline"
                className="rounded-full shrink-0 h-10 w-10"
                onClick={onStop}
                type="button"
                aria-label="Stop generating"
              >
                <IconSquareFilled size={14} />
              </Button>
            ) : (
              <Button
                size="icon"
                className="rounded-full shrink-0 h-10 w-10"
                onClick={handleSend}
                disabled={!canSend}
                type="button"
                aria-label="Send message"
              >
                <IconSend size={18} stroke={1.5} />
              </Button>
            )}
          </div>

          <div className="mt-2 flex justify-between items-center gap-2">
            <SelectModelDropdown />

            <p className="text-center mt-2 text-[11px] text-muted-foreground">
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">Enter</kbd> to send ·{" "}
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}