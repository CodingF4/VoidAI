import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface TopicTrend {
  topic: string;
  frequency: number;
  timestamp: string;
}

interface SentimentTrend {
  timestamp: string;
  sentiment: number;
  messageCount: number;
}

interface TrendAnalysis {
  topicTrends: TopicTrend[];
  sentimentTrends: SentimentTrend[];
  engagementScore: number;
}

export function ConversationTrends() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: trends, isLoading, refetch } = useQuery<TrendAnalysis>({
    queryKey: ["/api/trends"],
    enabled: false,
  });

  const handleOpen = () => {
    setIsOpen(true);
    refetch();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
          <BarChart3 className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">View conversation trends</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90vw] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Conversation Trends</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trends ? (
          <div className="space-y-8 mt-6 pr-6">
            {/* Topic Distribution Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Topic Distribution</h3>
              <ChartContainer className="h-[300px]" config={{}}>
                <BarChart data={trends.topicTrends}>
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                {payload[0].payload.topic}
                              </span>
                              <span className="font-mono text-right">
                                {payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="frequency"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Sentiment Trends Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sentiment & Engagement</h3>
              <ChartContainer className="h-[300px]" config={{}}>
                <LineChart data={trends.sentimentTrends}>
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            {payload.map((entry) => (
                              <div key={entry.name} className="flex items-center justify-between gap-2">
                                <span className="font-medium">
                                  {entry.name === "sentiment" ? "Sentiment" : "Messages"}
                                </span>
                                <span className="font-mono text-right">
                                  {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="var(--primary)"
                    yAxisId="left"
                  />
                  <Line
                    type="monotone"
                    dataKey="messageCount"
                    stroke="var(--muted-foreground)"
                    yAxisId="right"
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Overall Engagement Score */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Overall Engagement Score</h3>
              <p className="text-3xl font-bold text-primary">
                {(trends.engagementScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[80vh] text-muted-foreground">
            No trend data available
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
