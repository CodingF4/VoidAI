import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Share2, Paperclip, X } from "lucide-react";
import { PunctuationHelper } from "./punctuation-helper";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "./file-upload";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  onShare: () => void;
  onFileSelect?: (file: File | null) => void;
  isLoading: boolean;
  selectedFile?: File | null;
}

export function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  onClear, 
  onShare, 
  onFileSelect,
  isLoading,
  selectedFile 
}: MessageInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <div className="flex-1 truncate text-sm">
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-muted-foreground ml-2">
              ({Math.round(selectedFile.size / 1024)}KB)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onFileSelect?.(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={selectedFile ? "Tell me what to do with this file..." : "Type your message..."}
            disabled={isLoading}
            className="flex-1"
            aria-label="Message input"
          />
          {value && (
            <PunctuationHelper
              text={value}
              onApply={(correctedText) => onChange(correctedText)}
            />
          )}
        </div>
        <div className="flex gap-2 justify-end sm:justify-start">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="Attach file"
              >
                <Paperclip className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <FileUpload onFileSelect={onFileSelect || (() => {})} />
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onShare}
            aria-label="Share conversation"
          >
            <Share2 className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onClear}
            aria-label="Clear conversation"
          >
            <Trash2 className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !value.trim()}
            aria-label={isLoading ? "Sending message..." : "Send message"}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <div className="animate-spin" aria-hidden="true">⏳</div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">{isLoading ? "Sending..." : "Send"}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}