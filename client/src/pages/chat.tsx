import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { ConversationSummary } from "@/components/chat/conversation-summary";
import { ConversationStarters } from "@/components/chat/conversation-starters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";
import { ConversationMemory } from "@/components/chat/conversation-memory";
import { UserCircle2, ChevronLeft, ChevronRight, ArrowUpRight, Share2, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonalizationSettings } from "@/components/chat/personalization-settings";
import { usePersonalization } from "@/hooks/use-personalization";

export default function Chat() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { preferences } = usePersonalization();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { mutate: clearMessages } = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/messages");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/messages"], []);
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      toast({
        title: "Chat cleared",
        description: "All messages and summary have been cleared.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (content: string) => {
      const userMessage = {
        content: content.trim(),
        role: "user",
        id: Date.now(),
        timestamp: new Date(),
        userId: 1
      };

      // Add file information if a file is selected
      const messageWithFile = selectedFile ? {
        ...userMessage,
        attachment: {
          name: selectedFile.name,
          type: selectedFile.type,
          // Use the server URL if available (from the fileWithServerPath object)
          url: (selectedFile as any).serverUrl || `/uploads/${selectedFile.name}`
        }
      } : userMessage;

      queryClient.setQueryData(["/api/messages"], (old: Message[] = []) => [
        ...old,
        messageWithFile
      ]);

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Remove streaming to get a single complete response instead
            // 'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            content: content.trim(),
            role: "user",
            getResponse: true,
            attachment: selectedFile ? {
              name: selectedFile.name,
              type: selectedFile.type,
              url: (selectedFile as any).serverUrl || `/uploads/${selectedFile.name}`
            } : null
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const aiMessageId = Date.now() + 1;
        
        // Show typing indicator
        queryClient.setQueryData(["/api/messages"], (old: Message[] = []) => [
          ...old,
          {
            id: aiMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            userId: 1
          }
        ]);

        // Get the response as JSON
        const responseData = await response.json();
        
        // Apply additional heavy-duty text processing before displaying
        let aiContent = responseData.aiMessage?.content || "";
        
        // Apply more aggressive text processing for spacing issues
        const cleanedContent = aiContent
          // First, fix common full words that often get split
          .replace(/imag\s+in\s+e/gi, 'imagine')
          .replace(/con\s+nect\s+in\s+g/gi, 'connecting')
          .replace(/c\s+on\s+nect/gi, 'connect')
          .replace(/writ\s+in\s+g/gi, 'writing')
          .replace(/speak\s+in\s+g/gi, 'speaking')
          .replace(/mast\s+er/gi, 'master')
          .replace(/s\s+to\s+ry/gi, 'story')
          .replace(/s\s+to\s+ries/gi, 'stories')
          .replace(/amaz\s+in\s+g/gi, 'amazing')
          .replace(/toge\s+the\s+r/gi, 'together')
          .replace(/any\s+on\s+e/gi, 'anyone')
          .replace(/any\s+where/gi, 'anywhere')
          .replace(/solv\s+in\s+g/gi, 'solving')
          .replace(/be\s+in\s+g/gi, 'being')
          .replace(/cre\s+at\s+ive/gi, 'creative')
          .replace(/help\s+in\s+g/gi, 'helping')
          .replace(/o\s+the\s+rs/gi, 'others')
          .replace(/f\s+in\s+d/gi, 'find')
          .replace(/passi\s+on\s+s/gi, 'passions')
          .replace(/d\s+if\s+ferent/gi, 'different')
          .replace(/flu\s+ent\s+ly/gi, 'fluently')
          .replace(/with\s+out/gi, 'without')
          // Then try more generic patterns
          // Remove spaces between letters when it's likely a single word
          .replace(/(\w)\s+(\w)\s+(\w)/g, '$1$2$3')
          // Fix broken words with spaces inserted inside them
          .replace(/(?<=\w)\s(?=to|ry|in|or|es|at|er|gh|ng|on|th|it|en|ic)\b/g, '')
          // Fix camelCase
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          // Fix compound words with prepositions
          .replace(/(\w+)(from|to|in|at|by|of|on|for|with|the|and|or|if|is|was|about|through|during|between|among|within|without|because|while|when|where|what|how|why|who|that|this|these|those)(\w+)/gi, '$1 $2 $3')
          // Fix spacing punctuation
          .replace(/([.!?])(?=\S)/g, '$1 ')
          .replace(/,(?=\S)/g, ', ')
          .replace(/([;:])(?=\S)/g, '$1 ')
          // Fix multiple spaces
          .replace(/\s{2,}/g, ' ')
          .trim();

        // Update the typing indicator with the final response
        queryClient.setQueryData(["/api/messages"], (old: Message[] = []) => {
          const messages = [...old];
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content = cleanedContent;
            lastMessage.id = responseData.aiMessage?.id || aiMessageId;
          }
          return [...messages];
        });

        setInputValue("");
        setSelectedFile(null); // Clear the selected file after sending
        return cleanedContent;
      } catch (error) {
        console.error('Error during streaming:', error);
        throw error;
      } finally {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'VOID CHAT ASSISTANT Conversation',
          text: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        });
      } else {
        await navigator.clipboard.writeText(messages.map(m => `${m.role}: ${m.content}`).join('\n'));
        toast({
          title: "Conversation copied",
          description: "The conversation has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      // Store the server-generated filename in the selectedFile object
      // This ensures we use the correct path when sending it to the server
      const fileWithServerPath = new File([file], file.name, { type: file.type });
      // @ts-ignore - add custom properties to the file object
      fileWithServerPath.serverUrl = data.url;
      // @ts-ignore - add server filename
      fileWithServerPath.serverFilename = data.filename;
      
      setSelectedFile(fileWithServerPath);
      
      // No longer automatically adding text to the input field
      // User requested that file attachment shouldn't automatically add a message

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully. You can now ask me about it.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      setSelectedFile(null);
    }
  };

  const renderSidebarContent = () => (
    <Card className="h-full flex flex-col">
      <div className="p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold">Conversation Summary</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <ConversationSummary expanded={true} />
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">VOID CHAT ASSISTANT</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <PersonalizationSettings />
              {!isDesktop && (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                    >
                      <FileText className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Conversation Summary</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-8">
                      <ConversationSummary expanded={true} />
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
              <Badge variant="outline" className="capitalize">
                {user?.subscriptionTier}
              </Badge>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    <UserCircle2 className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">View Profile</Link>
                  </DropdownMenuItem>
                  {!user?.isAdmin && (
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/subscription" className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4" />
                        <span>Upgrade to Pro</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col h-[calc(100vh-4rem)] ${
        preferences.spacing === 'spacious' ? 'gap-6' :
        preferences.spacing === 'comfortable' ? 'gap-4' : 'gap-2'
      }`}>
        <div className="flex-1 container mx-auto p-2 sm:p-4 flex flex-col">
          <div className="flex-1 grid grid-cols-[1fr] md:grid-cols-[auto_1fr_auto] gap-4 relative h-full">
            {isDesktop && (
              <>
                <div className={`transition-all duration-300 ${showSidebar ? 'w-[300px]' : 'w-0 overflow-hidden'}`}>
                  <Card className="h-full flex flex-col">
                    <div className="p-4 flex-shrink-0">
                      <h2 className="text-lg font-semibold">Conversation Summary</h2>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <ConversationSummary expanded={true} />
                    </div>
                  </Card>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full hidden md:flex"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </>
            )}

            <Card className={`flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-full ${
              preferences.fontSize === 'large' ? 'text-lg' :
              preferences.fontSize === 'small' ? 'text-sm' : 'text-base'
            }`}>
              <div className="flex-1 p-3 sm:p-6 flex flex-col overflow-hidden">
                {messages.length === 0 && !isLoading && (
                  <ConversationStarters onSelect={setInputValue} />
                )}
                <MessageList messages={messages} isLoading={isLoading} isThinking={isPending} />
              </div>
              <div className="p-2 sm:p-4 border-t">
                <MessageInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSubmit}
                  onClear={clearMessages}
                  onShare={handleShare}
                  onFileSelect={handleFileSelect}
                  isLoading={isPending}
                  selectedFile={selectedFile}
                />
              </div>
            </Card>

            {!user?.isAdmin && isDesktop && (
              <div className="w-[200px] hidden md:flex flex-col items-end pt-4 pr-4">
                <Link href="/subscription">
                  <Button
                    variant="default"
                    size="lg"
                    className="flex items-center gap-2 w-full shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">Upgrade Now</span>
                      <span className="text-xs opacity-90">Get GPT-4 & More</span>
                    </div>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}