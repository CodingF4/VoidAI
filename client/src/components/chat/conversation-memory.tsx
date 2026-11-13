import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopicConnection {
  topic: string;
  relatedMessages: string[];
  sentiment: string;
}

interface TopicAnalysis {
  topics: string[];
  connections: TopicConnection[];
}

export function ConversationMemory() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: analysis, isLoading, refetch } = useQuery<TopicAnalysis>({
    queryKey: ["/api/topic-connections"],
    enabled: false, // Don't fetch automatically
  });

  const handleOpen = () => {
    setIsOpen(true);
    refetch();
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={handleOpen}
        >
          <Brain className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">View conversation memory</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Conversation Memory</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Topic Connections</h3>
                <div className="space-y-4">
                  {analysis.connections.map((connection, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{connection.topic}</h4>
                        <Badge className={getSentimentColor(connection.sentiment)}>
                          {connection.sentiment}
                        </Badge>
                      </div>
                      <ul className="list-disc pl-4 space-y-1">
                        {connection.relatedMessages.map((message, msgIndex) => (
                          <li key={msgIndex} className="text-sm text-muted-foreground">
                            {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No conversation analysis available
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
