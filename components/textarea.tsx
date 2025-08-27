import { modelID } from "@/ai/providers";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2, Clock } from "lucide-react";
import { ModelPicker } from "./model-picker";
import { useState, useEffect } from "react";

interface InputProps {
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  status: string;
  stop: () => void;
  selectedModel: modelID;
  setSelectedModel: (model: modelID) => void;
  cooldownActive?: boolean;
  lastResponseTime?: number | null;
}

export const Textarea = ({
  input,
  handleInputChange,
  isLoading,
  status,
  stop,
  selectedModel,
  setSelectedModel,
  cooldownActive,
  lastResponseTime,
}: InputProps) => {
  const isStreaming = status === "streaming" || status === "submitted";
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Handle countdown during cooldown period
  useEffect(() => {
    if (cooldownActive && lastResponseTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastResponseTime;
        const remaining = Math.max(0, 10000 - elapsed); // 10 seconds cooldown
        
        if (remaining > 0) {
          setCountdown(Math.ceil(remaining / 1000));
        } else {
          setCountdown(null);
        }
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [cooldownActive, lastResponseTime]);

  return (
    <div className="relative w-full">
      <ShadcnTextarea
        className="resize-none bg-background/50 dark:bg-muted/50 backdrop-blur-sm w-full rounded-2xl pr-12 pt-4 pb-16 border-input focus-visible:ring-ring placeholder:text-muted-foreground"
        value={input}
        autoFocus
        placeholder="Send a message..."
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isLoading && input.trim() && !cooldownActive) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <ModelPicker
        setSelectedModel={setSelectedModel}
        selectedModel={selectedModel}
      />

      <button
        type={isStreaming ? "button" : "submit"}
        onClick={isStreaming ? stop : undefined}
        disabled={
          (!isStreaming && !input.trim()) ||
          (isStreaming && status === "submitted") ||
          cooldownActive
        }
        className="absolute right-2 bottom-2 rounded-full disabled:bg-primary/50 p-2 bg-primary hover:bg-primary/90 disabled:cursor-not-allowed transition-all duration-200"
      >
        {countdown !== null ? (
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary-foreground" />
            <span className="text-xs text-primary-foreground ml-1 font-mono">{countdown}</span>
          </div>
        ) : isStreaming ? (
          <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
        ) : (
          <ArrowUp className="h-4 w-4 text-primary-foreground" />
        )}
      </button>
    </div>
  );
};
