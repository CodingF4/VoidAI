import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Type } from "lucide-react";

interface PunctuationHelperProps {
  text: string;
  onApply: (correctedText: string) => void;
}

export function PunctuationHelper({ text, onApply }: PunctuationHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [correctedText, setCorrectedText] = useState(text);

  const fixPunctuation = (input: string): string => {
    return input
      .replace(/([.,!?])(?=\S)/g, '$1 ')  // Add space after punctuation if followed by non-space
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space between camelCase words
      .replace(/\s{2,}/g, ' ')  // Normalize multiple spaces to single space
      .replace(/([.!?])\s+/g, '$1 ')  // Ensure single space after sentence endings
      .replace(/,\s*/g, ', ')  // Ensure proper comma spacing
      .trim();
  };

  const handleOpen = () => {
    setIsOpen(true);
    setCorrectedText(fixPunctuation(text));
  };

  const handleApply = () => {
    onApply(correctedText);
    setIsOpen(false);
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
          <Type className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Fix text formatting</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Punctuation Helper</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Original Text</h3>
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">{text}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Corrected Text</h3>
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">{correctedText}</p>
              </div>
            </div>
            <Button className="w-full" onClick={handleApply}>
              Apply Corrections
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
