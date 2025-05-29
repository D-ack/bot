import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import StatsCard from "@/components/stats-card";
import PlatformStatus from "@/components/platform-status";
import ChatPreview from "@/components/chat-preview";
import {
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Brain,
  Download,
  FileText,
  Play,
  Bell,
  Save
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BotConfig, MlModel, Log } from "@shared/schema";

interface DashboardStats {
  totalMessages: number;
  activeUsers: number;
  responseRate: number;
  avgResponseTime: string;
  todayMessages: number;
  mlAccuracy: number;
  activePlatforms: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isConnected } = useWebSocket();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const { data: botConfig } = useQuery<BotConfig>({
    queryKey: ["/api/bot/config"],
  });

  const { data: mlModel } = useQuery<MlModel>({
    queryKey: ["/api/ml/model"],
  });

  const { data: recentLogs = [] } = useQuery<Log[]>({
    queryKey: ["/api/logs"],
  });

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<BotConfig>) =>
      apiRequest("PATCH", "/api/bot/config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/config"] });
      toast({ title: "Configuration saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save configuration", variant: "destructive" });
    },
  });

  const trainModelMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ml/train"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ml/model"] });
      toast({ title: "Model training started successfully" });
    },
    onError: () => {
      toast({ title: "Failed to start model training", variant: "destructive" });
    },
  });

  const handleSaveConfig = () => {
    if (!botConfig) return;
    updateConfigMutation.mutate(botConfig);
  };

  if (statsLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </header>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
            <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor and manage your LuvSmithCorp bot across all platforms
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></span>
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </div>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4 mr-2" />
              Deploy Bot
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Messages"
            value={stats?.totalMessages?.toLocaleString() || "0"}
            change="+12% from last month"
            changeType="positive"
            icon={MessageSquare}
            iconColor="text-primary"
          />
          <StatsCard
            title="Active Users"
            value={stats?.activeUsers?.toLocaleString() || "0"}
            change="+18% from last month"
            changeType="positive"
            icon={Users}
            iconColor="text-accent"
          />
          <StatsCard
            title="Response Rate"
            value={`${stats?.responseRate || 0}%`}
            change="+2.1% from last month"
            changeType="positive"
            icon={CheckCircle}
            iconColor="text-accent"
          />
          <StatsCard
            title="Avg Response Time"
            value={stats?.avgResponseTime || "0s"}
            change="-0.3s from last month"
            changeType="positive"
            icon={Clock}
            iconColor="text-primary"
          />
        </div>

        {/* Platform Status & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PlatformStatus />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => trainModelMutation.mutate()}
                disabled={trainModelMutation.isPending}
              >
                <Brain className="h-4 w-4 mr-2" />
                {trainModelMutation.isPending ? "Training..." : "Train ML Model"}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Template
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Test Bot
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat Preview & ML Model Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChatPreview />

          {/* ML Model Status */}
          <Card>
            <CardHeader>
              <CardTitle>ML Model Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Model Accuracy</span>
                  <span className="text-sm font-medium text-foreground">{mlModel?.accuracy || 0}%</span>
                </div>
                <Progress value={mlModel?.accuracy || 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Training Progress</span>
                  <span className="text-sm font-medium text-foreground">Complete</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Training</p>
                    <p className="text-xs text-muted-foreground">
                      {mlModel?.lastTrainedAt 
                        ? formatDistanceToNow(new Date(mlModel.lastTrainedAt), { addSuffix: true })
                        : "Never"
                      }
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => trainModelMutation.mutate()}
                    disabled={trainModelMutation.isPending}
                  >
                    Retrain
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                <span className="text-sm text-muted-foreground">Model is healthy and performing well</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.level === 'error' ? 'bg-destructive/10' :
                        log.level === 'warn' ? 'bg-yellow-100' : 'bg-accent/10'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          log.level === 'error' ? 'bg-destructive' :
                          log.level === 'warn' ? 'bg-yellow-600' : 'bg-accent'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })} • {log.source}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="botName" className="text-sm font-medium">Bot Name</Label>
                <Input
                  id="botName"
                  value={botConfig?.name || ""}
                  onChange={(e) => {
                    if (botConfig) {
                      queryClient.setQueryData(["/api/bot/config"], {
                        ...botConfig,
                        name: e.target.value
                      });
                    }
                  }}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Response Tone</Label>
                <Select
                  value={botConfig?.tone || "professional"}
                  onValueChange={(value) => {
                    if (botConfig) {
                      queryClient.setQueryData(["/api/bot/config"], {
                        ...botConfig,
                        tone: value
                      });
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Min. Confidence (%)</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Slider
                    value={[botConfig?.confidenceThreshold || 75]}
                    onValueChange={([value]) => {
                      if (botConfig) {
                        queryClient.setQueryData(["/api/bot/config"], {
                          ...botConfig,
                          confidenceThreshold: value
                        });
                      }
                    }}
                    max={99}
                    min={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">{botConfig?.confidenceThreshold || 75}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Responses below this threshold will be escalated
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-Training</p>
                  <p className="text-xs text-muted-foreground">Continuously improve with new data</p>
                </div>
                <Switch
                  checked={botConfig?.autoTraining || false}
                  onCheckedChange={(checked) => {
                    if (botConfig) {
                      queryClient.setQueryData(["/api/bot/config"], {
                        ...botConfig,
                        autoTraining: checked
                      });
                    }
                  }}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
