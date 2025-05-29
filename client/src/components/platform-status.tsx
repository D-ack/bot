import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, RefreshCw } from "lucide-react";
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import type { Platform } from "@shared/schema";

export default function PlatformStatus() {
  const { data: platforms = [], isLoading, refetch } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const getPlatformIcon = (name: string) => {
    switch (name) {
      case "whatsapp":
        return <FaWhatsapp className="text-green-600 text-xl" />;
      case "telegram":
        return <FaTelegram className="text-blue-600 text-xl" />;
      case "messenger":
        return <FaFacebookMessenger className="text-blue-800 text-xl" />;
      default:
        return <Settings className="text-gray-600 text-xl" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent text-white";
      case "inactive":
        return "bg-muted text-muted-foreground";
      case "error":
        return "bg-destructive text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPlatformName = (name: string) => {
    switch (name) {
      case "whatsapp":
        return "WhatsApp Business";
      case "telegram":
        return "Telegram Bot";
      case "messenger":
        return "Facebook Messenger";
      default:
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Platform Status</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getPlatformIcon(platform.name)}
                <div>
                  <p className="font-medium text-foreground">
                    {getPlatformName(platform.name)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {platform.status === "active" ? "Connected & Active" : "Disconnected"} • {platform.messagesCount} messages
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(platform.status)}>
                  {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
