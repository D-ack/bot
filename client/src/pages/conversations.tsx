import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Conversation, Message, Platform } from "@shared/schema";
import { Search, MessageSquare, Clock, User, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from "react-icons/fa";

export default function Conversations() {
  const { isConnected } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: selectedConversation !== null,
  });

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || conv.platformId.toString() === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getPlatformIcon = (platformId: number) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return <MessageSquare className="h-4 w-4" />;
    
    switch (platform.name) {
      case "whatsapp":
        return <FaWhatsapp className="text-green-600" />;
      case "telegram":
        return <FaTelegram className="text-blue-600" />;
      case "messenger":
        return <FaFacebookMessenger className="text-blue-800" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPlatformName = (platformId: number) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent text-white";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      case "escalated":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </header>
        <div className="p-6">
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Conversations</h2>
            <p className="text-muted-foreground">
              Monitor and manage all bot conversations across platforms
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></span>
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Conversation List */}
        <div className="w-1/2 border-r border-border flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-border space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id.toString()}>
                      {platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No conversations found</h3>
                <p className="text-muted-foreground">
                  {conversations.length === 0 
                    ? "No conversations have been started yet"
                    : "Try adjusting your search or filters"
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation === conversation.id ? 'bg-muted/50 border-r-2 border-r-primary' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {conversation.userName || `User ${conversation.userId.slice(-4)}`}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {getPlatformIcon(conversation.platformId)}
                            <span>{getPlatformName(conversation.platformId)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(conversation.status)}>
                        {conversation.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {conversation.messagesCount} messages
                      </span>
                      <span className="text-muted-foreground">
                        {conversation.lastMessageAt 
                          ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
                          : formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="w-1/2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-border">
                {(() => {
                  const conversation = conversations.find(c => c.id === selectedConversation);
                  if (!conversation) return null;
                  
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {conversation.userName || `User ${conversation.userId.slice(-4)}`}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            {getPlatformIcon(conversation.platformId)}
                            <span>{getPlatformName(conversation.platformId)}</span>
                            <span>•</span>
                            <span>ID: {conversation.userId}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(conversation.status)}>
                        {conversation.status}
                      </Badge>
                    </div>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <p className={`text-xs ${
                          message.sender === "user" 
                            ? "text-primary-foreground/75" 
                            : "text-muted-foreground"
                        }`}>
                          {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                        </p>
                        {message.sender === "bot" && message.confidence && (
                          <p className="text-xs text-muted-foreground">
                            {message.confidence}% confidence
                          </p>
                        )}
                        {message.responseTime && (
                          <p className="text-xs text-muted-foreground">
                            {message.responseTime}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No messages</h3>
                    <p className="text-muted-foreground">This conversation hasn't started yet</p>
                  </div>
                )}
              </div>

              {/* Conversation Actions */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Mark as Resolved
                  </Button>
                  <Button variant="outline" size="sm">
                    Escalate
                  </Button>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
