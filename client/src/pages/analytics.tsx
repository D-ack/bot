import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Analytics, Platform } from "@shared/schema";
import { TrendingUp, TrendingDown, BarChart3, Users, MessageSquare, Clock, Target, Download } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { useState } from "react";

interface DashboardStats {
  totalMessages: number;
  activeUsers: number;
  responseRate: number;
  avgResponseTime: string;
  todayMessages: number;
  mlAccuracy: number;
  activePlatforms: number;
}

export default function Analytics() {
  const { isConnected } = useWebSocket();
  const [timeRange, setTimeRange] = useState("7");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: analytics = [] } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  // Calculate trends (simplified - in real implementation, compare with previous period)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 100, type: "positive" as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      type: change >= 0 ? "positive" as const : "negative" as const
    };
  };

  const getTrendIcon = (type: "positive" | "negative") => {
    return type === "positive" ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (type: "positive" | "negative") => {
    return type === "positive" ? "text-accent" : "text-destructive";
  };

  // Generate mock trend data for demonstration
  const messageTrend = calculateTrend(stats?.totalMessages || 0, (stats?.totalMessages || 0) * 0.88);
  const userTrend = calculateTrend(stats?.activeUsers || 0, (stats?.activeUsers || 0) * 0.82);
  const responseTrend = calculateTrend(stats?.responseRate || 0, (stats?.responseRate || 0) * 0.98);
  const timeTrend = calculateTrend(1200, 1380); // Response time (lower is better, so reverse)

  // Platform breakdown
  const platformBreakdown = platforms.map(platform => ({
    name: platform.name,
    messages: platform.messagesCount,
    percentage: platforms.length > 0 
      ? (platform.messagesCount / platforms.reduce((sum, p) => sum + p.messagesCount, 0)) * 100 
      : 0
  }));

  const getPlatformName = (name: string) => {
    switch (name) {
      case "whatsapp":
        return "WhatsApp";
      case "telegram":
        return "Telegram";
      case "messenger":
        return "Messenger";
      default:
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Analytics</h2>
            <p className="text-muted-foreground">
              Monitor your bot's performance and user engagement metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></span>
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.totalMessages?.toLocaleString() || "0"}
                  </p>
                  <div className="flex items-center mt-2">
                    {(() => {
                      const TrendIcon = getTrendIcon(messageTrend.type);
                      return (
                        <TrendIcon className={`h-4 w-4 mr-1 ${getTrendColor(messageTrend.type)}`} />
                      );
                    })()}
                    <span className={`text-sm ${getTrendColor(messageTrend.type)}`}>
                      {messageTrend.value.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.activeUsers?.toLocaleString() || "0"}
                  </p>
                  <div className="flex items-center mt-2">
                    {(() => {
                      const TrendIcon = getTrendIcon(userTrend.type);
                      return (
                        <TrendIcon className={`h-4 w-4 mr-1 ${getTrendColor(userTrend.type)}`} />
                      );
                    })()}
                    <span className={`text-sm ${getTrendColor(userTrend.type)}`}>
                      {userTrend.value.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.responseRate || 0}%
                  </p>
                  <div className="flex items-center mt-2">
                    {(() => {
                      const TrendIcon = getTrendIcon(responseTrend.type);
                      return (
                        <TrendIcon className={`h-4 w-4 mr-1 ${getTrendColor(responseTrend.type)}`} />
                      );
                    })()}
                    <span className={`text-sm ${getTrendColor(responseTrend.type)}`}>
                      {responseTrend.value.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats?.avgResponseTime || "0s"}
                  </p>
                  <div className="flex items-center mt-2">
                    {(() => {
                      const TrendIcon = getTrendIcon("positive"); // Assuming improvement
                      return (
                        <TrendIcon className={`h-4 w-4 mr-1 ${getTrendColor("positive")}`} />
                      );
                    })()}
                    <span className="text-sm text-accent">
                      15ms faster
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">vs previous period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformBreakdown.map((platform, index) => (
                  <div key={platform.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {getPlatformName(platform.name)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {platform.messages.toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {platform.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-accent' :
                          index === 1 ? 'bg-primary' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.max(platform.percentage, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}

                {platformBreakdown.length === 0 && (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No data available</h3>
                    <p className="text-muted-foreground">Connect platforms to see breakdown</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">ML Model Accuracy</span>
                    <span className="text-sm font-medium text-foreground">{stats?.mlAccuracy || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-accent h-3 rounded-full"
                      style={{ width: `${stats?.mlAccuracy || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">User Satisfaction</span>
                    <span className="text-sm font-medium text-foreground">87%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: "87%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Resolution Rate</span>
                    <span className="text-sm font-medium text-foreground">92%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Escalation Rate</span>
                    <span className="text-sm font-medium text-foreground">5%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: "5%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">User Engagement</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">New Users Today</span>
                    <span className="text-sm font-semibold">{Math.floor((stats?.activeUsers || 0) * 0.15)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Returning Users</span>
                    <span className="text-sm font-semibold">{Math.floor((stats?.activeUsers || 0) * 0.85)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Avg Session Length</span>
                    <span className="text-sm font-semibold">4.2 min</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Bot Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Successful Responses</span>
                    <span className="text-sm font-semibold">{stats?.responseRate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Failed Responses</span>
                    <span className="text-sm font-semibold">{100 - (stats?.responseRate || 0)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Peak Response Time</span>
                    <span className="text-sm font-semibold">2:00 PM - 4:00 PM</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Content Analytics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Most Used Template</span>
                    <span className="text-sm font-semibold">Welcome Message</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Top Intent</span>
                    <span className="text-sm font-semibold">Customer Support</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Sentiment Score</span>
                    <span className="text-sm font-semibold">Positive (78%)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
