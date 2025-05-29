import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function ChatPreview() {
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/recent"],
    refetchInterval: 5000,
  });

  // Real-time updates via WebSocket
  const { isConnected } = useWebSocket();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Live Chat Preview
            <Badge variant="outline" className="text-xs">
              Loading...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded-lg p-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-3">
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live Chat Preview
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></span>
            <Badge variant="outline" className="text-xs">
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 bg-muted/30 rounded-lg p-4 overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
            {messages.slice(0, 10).map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      message.sender === "user" 
                        ? "text-primary-foreground/75" 
                        : "text-muted-foreground"
                    }`}>
                      {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                    </p>
                    {message.sender === "bot" && message.confidence && (
                      <p className="text-xs text-muted-foreground ml-2">
                        {message.confidence}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">No recent messages</p>
                <p className="text-xs mt-1">Messages will appear here in real-time</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
