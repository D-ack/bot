import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlatformSchema } from "@shared/schema";
import type { Platform, InsertPlatform } from "@shared/schema";
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from "react-icons/fa";
import { Plus, Settings, Power, PowerOff, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Platforms() {
  const { toast } = useToast();
  const { isConnected } = useWebSocket();
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: platforms = [], isLoading } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const form = useForm<InsertPlatform>({
    resolver: zodResolver(insertPlatformSchema),
    defaultValues: {
      name: "",
      status: "inactive",
      apiKey: "",
      webhookUrl: "",
      config: {},
    },
  });

  const createPlatformMutation = useMutation({
    mutationFn: (data: InsertPlatform) => apiRequest("POST", "/api/platforms", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({ title: "Platform added successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add platform", variant: "destructive" });
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertPlatform> }) =>
      apiRequest("PATCH", `/api/platforms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({ title: "Platform updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update platform", variant: "destructive" });
    },
  });

  const getPlatformIcon = (name: string) => {
    switch (name) {
      case "whatsapp":
        return <FaWhatsapp className="text-green-600 text-2xl" />;
      case "telegram":
        return <FaTelegram className="text-blue-600 text-2xl" />;
      case "messenger":
        return <FaFacebookMessenger className="text-blue-800 text-2xl" />;
      default:
        return <Settings className="text-gray-600 text-2xl" />;
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

  const togglePlatformStatus = (platform: Platform) => {
    const newStatus = platform.status === "active" ? "inactive" : "active";
    updatePlatformMutation.mutate({
      id: platform.id,
      data: { status: newStatus },
    });
  };

  const toggleApiKeyVisibility = (platformId: number) => {
    setShowApiKeys(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  const onSubmit = (data: InsertPlatform) => {
    createPlatformMutation.mutate(data);
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
                <div className="h-48 bg-muted rounded-xl"></div>
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
            <h2 className="text-2xl font-semibold text-foreground">Platform Integration</h2>
            <p className="text-muted-foreground">
              Connect and manage your chatbot across multiple platforms
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></span>
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Platform</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                              <SelectItem value="telegram">Telegram Bot</SelectItem>
                              <SelectItem value="messenger">Facebook Messenger</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key / Bot Token</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your API key or bot token"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="webhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://your-domain.com/webhook"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPlatformMutation.isPending}
                      >
                        {createPlatformMutation.isPending ? "Adding..." : "Add Platform"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Platform Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Platforms</p>
                  <p className="text-2xl font-bold text-foreground">{platforms.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Platforms</p>
                  <p className="text-2xl font-bold text-foreground">
                    {platforms.filter(p => p.status === "active").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Power className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold text-foreground">
                    {platforms.reduce((sum, p) => sum + p.messagesCount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaTelegram className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform List */}
        <div className="space-y-6">
          {platforms.map((platform) => (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {getPlatformIcon(platform.name)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{getPlatformName(platform.name)}</CardTitle>
                      <p className="text-muted-foreground">
                        {platform.messagesCount.toLocaleString()} messages processed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(platform.status)}>
                      {platform.status.charAt(0).toUpperCase() + platform.status.slice(1)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlatformStatus(platform)}
                      disabled={updatePlatformMutation.isPending}
                    >
                      {platform.status === "active" ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Configuration</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">API Key</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono">
                              {showApiKeys[platform.id] ? platform.apiKey || "Not configured" : "••••••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleApiKeyVisibility(platform.id)}
                            >
                              {showApiKeys[platform.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">Webhook URL</span>
                          <span className="text-sm font-mono truncate max-w-48">
                            {platform.webhookUrl || "Auto-configured"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Statistics</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">Messages Today</span>
                          <span className="text-sm font-semibold">
                            {Math.floor(platform.messagesCount * 0.1).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">Last Message</span>
                          <span className="text-sm">
                            {platform.lastMessageAt 
                              ? formatDistanceToNow(new Date(platform.lastMessageAt), { addSuffix: true })
                              : "Never"
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">Status Since</span>
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(platform.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    Test Connection
                  </Button>
                  <Button variant="outline" size="sm">
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {platforms.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No platforms configured</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by adding your first platform integration
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Platform
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
