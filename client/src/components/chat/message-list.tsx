import { Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isThinking: boolean;
}

export function MessageList({ messages, isLoading, isThinking }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-2/3 ml-auto" />
        <Skeleton className="h-12 w-3/4" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 -mr-6 pr-6">
      <div className="space-y-4 flex flex-col">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "assistant" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 whitespace-pre-wrap ${
                message.role === "assistant"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
              style={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-muted text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-150" />
                <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-300" />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}