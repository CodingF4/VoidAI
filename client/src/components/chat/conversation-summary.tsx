import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SummaryResponse {
  summary: string;
  keyInsights: string[];
}

interface ConversationSummaryProps {
  expanded?: boolean;
}

export function ConversationSummary({ expanded = false }: ConversationSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: summary, isLoading, refetch } = useQuery<SummaryResponse>({
    queryKey: ["/api/summary"],
    enabled: expanded, // Auto-fetch when expanded in sidebar
  });

  const handleOpen = () => {
    setIsOpen(true);
    refetch();
  };

  // If expanded, render directly in the sidebar
  if (expanded) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="text-center text-muted-foreground">
          No conversation summary available
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 px-4">Summary</h3>
            <p className="text-muted-foreground px-4">{summary.summary}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 px-4">Key Insights</h3>
            <ul className="list-disc pl-8 pr-4 space-y-2">
              {summary.keyInsights.map((insight, index) => (
                <li key={index} className="text-muted-foreground">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // If not expanded, render as a sheet (modal)
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={handleOpen}
        >
          <BookOpen className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">View conversation summary</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Conversation Summary</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : summary ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 px-4">Summary</h3>
                <p className="text-muted-foreground px-4">{summary.summary}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 px-4">Key Insights</h3>
                <ul className="list-disc pl-8 pr-4 space-y-2">
                  {summary.keyInsights.map((insight, index) => (
                    <li key={index} className="text-muted-foreground">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No conversation summary available
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}