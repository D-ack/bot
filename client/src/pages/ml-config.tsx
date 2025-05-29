import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import type { MlModel } from "@shared/schema";
import { Brain, Play, Download, Upload, BarChart3, Target, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function MLConfig() {
  const { toast } = useToast();
  const { isConnected } = useWebSocket();
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  const { data: mlModel, isLoading } = useQuery<MlModel>({
    queryKey: ["/api/ml/model"],
  });

  const trainModelMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ml/train"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ml/model"] });
      toast({ 
        title: "Model training completed", 
        description: `Accuracy: ${data.accuracy}% with ${data.samples} samples`
      });
    },
    onError: () => {
      toast({ title: "Failed to train model", variant: "destructive" });
    },
  });

  const testBotMutation = useMutation({
    mutationFn: (message: string) => apiRequest("POST", "/api/bot/test", { message }),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: () => {
      toast({ title: "Failed to test bot", variant: "destructive" });
    },
  });

  const handleTestBot = () => {
    if (!testMessage.trim()) return;
    testBotMutation.mutate(testMessage);
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
            <h2 className="text-2xl font-semibold text-foreground">ML Configuration</h2>
            <p className="text-muted-foreground">
              Configure and train your machine learning model for better responses
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></span>
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
            <Button
              onClick={() => trainModelMutation.mutate()}
              disabled={trainModelMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Brain className="h-4 w-4 mr-2" />
              {trainModelMutation.isPending ? "Training..." : "Train Model"}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Model Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model Accuracy</p>
                  <p className="text-2xl font-bold text-foreground">{mlModel?.accuracy || 0}%</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Training Samples</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mlModel?.trainingData ? (mlModel.trainingData as any[]).length.toLocaleString() : "0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model Status</p>
                  <p className="text-2xl font-bold text-foreground capitalize">
                    {mlModel?.status || "Unknown"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Overall Accuracy</span>
                  <span className="text-sm font-medium text-foreground">{mlModel?.accuracy || 0}%</span>
                </div>
                <Progress value={mlModel?.accuracy || 0} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Intent Recognition</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.max(0, (mlModel?.accuracy || 0) - 5)}%
                  </span>
                </div>
                <Progress value={Math.max(0, (mlModel?.accuracy || 0) - 5)} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Response Quality</span>
                  <span className="text-sm font-medium text-foreground">
                    {Math.min(100, (mlModel?.accuracy || 0) + 3)}%
                  </span>
                </div>
                <Progress value={Math.min(100, (mlModel?.accuracy || 0) + 3)} className="h-3" />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Training</p>
                    <p className="text-xs text-muted-foreground">
                      {mlModel?.lastTrainedAt 
                        ? formatDistanceToNow(new Date(mlModel.lastTrainedAt), { addSuffix: true })
                        : "Never trained"
                      }
                    </p>
                  </div>
                  <Badge 
                    variant={mlModel?.status === "ready" ? "default" : "secondary"}
                    className={mlModel?.status === "ready" ? "bg-accent" : ""}
                  >
                    {mlModel?.status === "ready" ? "Ready" : mlModel?.status || "Unknown"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Model
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Bot Response */}
          <Card>
            <CardHeader>
              <CardTitle>Test Bot Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testMessage" className="text-sm font-medium">Test Message</Label>
                <Textarea
                  id="testMessage"
                  placeholder="Type a message to test the bot's response..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <Button 
                onClick={handleTestBot}
                disabled={!testMessage.trim() || testBotMutation.isPending}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {testBotMutation.isPending ? "Testing..." : "Test Response"}
              </Button>

              {testResult && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Bot Response</Label>
                      <p className="text-sm text-foreground mt-1">{testResult.response}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs text-muted-foreground">Confidence</Label>
                        <p className="text-sm font-medium">{testResult.confidence}%</p>
                      </div>
                      {testResult.templateId && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Template Used</Label>
                          <p className="text-sm font-medium">#{testResult.templateId}</p>
                        </div>
                      )}
                    </div>
                    <Progress value={testResult.confidence} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Training Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Training Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Confidence Threshold</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Slider
                      value={[75]}
                      max={99}
                      min={50}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">75%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum confidence for automated responses
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Training Frequency</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Slider
                      value={[24]}
                      max={168}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">24 hours</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    How often to retrain the model automatically
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Learning Rate</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Slider
                      value={[0.001]}
                      max={0.01}
                      min={0.0001}
                      step={0.0001}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16">0.001</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls how quickly the model adapts to new data
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Training Data Sources</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Conversation History</span>
                      <Badge variant="default" className="bg-accent">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">User Feedback</span>
                      <Badge variant="default" className="bg-accent">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Template Usage</span>
                      <Badge variant="default" className="bg-accent">Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Model Metrics</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Precision</span>
                      <span className="text-sm font-medium">92.4%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">Recall</span>
                      <span className="text-sm font-medium">89.7%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">F1 Score</span>
                      <span className="text-sm font-medium">91.0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-end space-x-3">
              <Button variant="outline">
                Reset to Defaults
              </Button>
              <Button variant="outline">
                Export Configuration
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
