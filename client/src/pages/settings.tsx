import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBotConfigSchema } from "@shared/schema";
import type { BotConfig, InsertBotConfig, Platform } from "@shared/schema";
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  Shield, 
  Key, 
  Bell, 
  Globe, 
  Database, 
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { isConnected } = useWebSocket();
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const { data: botConfig, isLoading: configLoading } = useQuery<BotConfig>({
    queryKey: ["/api/bot/config"],
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const form = useForm<InsertBotConfig>({
    resolver: zodResolver(insertBotConfigSchema),
    defaultValues: {
      name: botConfig?.name || "LuvSmithCorp Bot",
      language: botConfig?.language || "en",
      tone: botConfig?.tone || "professional",
      confidenceThreshold: botConfig?.confidenceThreshold || 75,
      maxResponseTime: botConfig?.maxResponseTime || 3,
      fallbackMessage: botConfig?.fallbackMessage || "Sorry, I didn't understand that. Can you please rephrase?",
      autoTraining: botConfig?.autoTraining || true,
    },
  });

  // Update form when botConfig loads
  if (botConfig && !configLoading) {
    form.reset({
      name: botConfig.name,
      language: botConfig.language,
      tone: botConfig.tone,
      confidenceThreshold: botConfig.confidenceThreshold,
      maxResponseTime: botConfig.maxResponseTime,
      fallbackMessage: botConfig.fallbackMessage,
      autoTraining: botConfig.autoTraining,
    });
  }

  const updateConfigMutation = useMutation({
    mutationFn: (config: InsertBotConfig) =>
      apiRequest("PATCH", "/api/bot/config", config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/config"] });
      toast({ title: "Configuration saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save configuration", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertBotConfig) => {
    updateConfigMutation.mutate(data);
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

  if (configLoading) {
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
                <div className="h-64 bg-muted rounded-xl"></div>
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
            <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
            <p className="text-muted-foreground">
              Configure your LuvSmithCorp bot and system preferences
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

      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="ml">ML & AI</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Bot Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bot Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bot name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This name will be displayed across all platforms
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="it">Italian</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Response Tone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="formal">Formal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxResponseTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Response Time (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="30"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum time before timeout
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="confidenceThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confidence Threshold: {field.value}%</FormLabel>
                          <FormControl>
                            <Slider
                              min={50}
                              max={99}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum confidence required for automated responses
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fallbackMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fallback Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter fallback message"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Message sent when confidence is below threshold
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoTraining"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Training</FormLabel>
                            <FormDescription>
                              Automatically train the model with new conversation data
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateConfigMutation.isPending}
                        className="min-w-32"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateConfigMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings */}
          <TabsContent value="platforms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Platform API Keys</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {platforms.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No platforms configured</h3>
                    <p className="text-muted-foreground">Add platforms to manage their API keys here</p>
                  </div>
                ) : (
                  platforms.map((platform) => (
                    <div key={platform.id} className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{getPlatformName(platform.name)}</h4>
                          <p className="text-sm text-muted-foreground">
                            Status: <Badge className={platform.status === "active" ? "bg-accent" : "bg-muted"}>
                              {platform.status}
                            </Badge>
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`apiKey-${platform.id}`}>API Key / Bot Token</Label>
                          <div className="flex mt-2">
                            <Input
                              id={`apiKey-${platform.id}`}
                              type={showApiKeys[platform.name] ? "text" : "password"}
                              value={platform.apiKey || ""}
                              placeholder="Enter API key"
                              className="flex-1"
                              readOnly
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              onClick={() => toggleApiKeyVisibility(platform.name)}
                            >
                              {showApiKeys[platform.name] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`webhook-${platform.id}`}>Webhook URL</Label>
                          <Input
                            id={`webhook-${platform.id}`}
                            value={platform.webhookUrl || "Auto-configured"}
                            className="mt-2"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Messages</p>
                            <p className="font-semibold">{platform.messagesCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Active</p>
                            <p className="font-semibold">
                              {platform.lastMessageAt ? "Recently" : "Never"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Health</p>
                            <p className="font-semibold flex items-center">
                              {platform.status === "active" ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-accent mr-1" />
                                  Healthy
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                                  Inactive
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML & AI Settings */}
          <TabsContent value="ml" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Machine Learning Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Training Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Model Version</Label>
                    <Input value="v2.1.0" className="mt-2" readOnly />
                  </div>
                </div>

                <div>
                  <Label>Training Data Sources</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Conversation History</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>User Feedback</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Template Usage Patterns</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>External Knowledge Base</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Advanced Settings</Label>
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label className="text-sm">Learning Rate: 0.001</Label>
                      <Slider
                        defaultValue={[0.001]}
                        max={0.01}
                        min={0.0001}
                        step={0.0001}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Batch Size: 32</Label>
                      <Slider
                        defaultValue={[32]}
                        max={128}
                        min={8}
                        step={8}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security & Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label className="text-base">Data Encryption</Label>
                      <p className="text-sm text-muted-foreground">Encrypt all conversation data at rest</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label className="text-base">Message Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all messages for analysis and improvement</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label className="text-base">PII Detection</Label>
                      <p className="text-sm text-muted-foreground">Automatically detect and mask personal information</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <Label className="text-base">Rate Limiting</Label>
                      <p className="text-sm text-muted-foreground">Limit requests per user to prevent abuse</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base">Data Retention</Label>
                  <Select defaultValue="90">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">API Access</Label>
                  <div className="mt-2 p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">API Key</span>
                      <Button variant="outline" size="sm">
                        <Key className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                    <Input
                      type="password"
                      value="lsc_••••••••••••••••••••••••••••"
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Export Data</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Conversations
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Templates
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Analytics
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Import Data</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Training Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Templates
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Configuration
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Storage Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">Conversations</p>
                      <p className="text-2xl font-bold text-foreground">2.3 MB</p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">ML Models</p>
                      <p className="text-2xl font-bold text-foreground">45.7 MB</p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Usage</p>
                      <p className="text-2xl font-bold text-foreground">48.0 MB</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground text-destructive">Danger Zone</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive hover:text-white">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Conversations
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive hover:text-white">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset ML Model
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive hover:text-white">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
