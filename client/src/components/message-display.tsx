import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LoadingMessage } from "./loading-message";

interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  isLoading?: boolean;
}

export function MessageDisplay({ content, role, isLoading }: MessageProps) {
  if (role === 'assistant' && isLoading) {
    return <LoadingMessage />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "px-4 py-3 rounded-lg",
        role === "assistant" ? "bg-muted" : "bg-primary/10"
      )}
    >
      <p 
        className="text-base leading-7"
        style={{ 
          whiteSpace: "pre-line",
          wordBreak: "break-word"
        }}
      >
        {content}
      </p>
    </motion.div>
  );
}