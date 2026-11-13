import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface StarterSuggestion {
  text: string;
  category: string;
}

export function ConversationStarters({ onSelect }: { onSelect: (text: string) => void }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: suggestions = [], isLoading } = useQuery<StarterSuggestion[]>({
    queryKey: ["/api/suggestions"],
    enabled: showSuggestions,
  });

  if (!showSuggestions) {
    return (
      <Button
        variant="ghost"
        className="w-full flex gap-2 items-center justify-center py-8 rounded-lg border-2 border-dashed"
        onClick={() => setShowSuggestions(true)}
      >
        <Sparkles className="h-5 w-5" />
        Get conversation starters
      </Button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      {suggestions.map((suggestion, index) => (
        <Card
          key={index}
          className="p-3 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => {
            onSelect(suggestion.text);
            setShowSuggestions(false);
          }}
        >
          <p className="text-sm">{suggestion.text}</p>
          <span className="text-xs text-muted-foreground mt-1 block">
            {suggestion.category}
          </span>
        </Card>
      ))}
    </div>
  );
}
