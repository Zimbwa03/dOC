import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Search,
  Send,
  Loader2
} from "lucide-react";

export interface AIInsight {
  id: string;
  type: 'diagnostic' | 'treatment' | 'clinical_note' | 'warning';
  content: string;
  confidence: number;
  timestamp: Date;
  sources?: string[];
}

interface AIAssistantProps {
  insights: AIInsight[];
  isAnalyzing?: boolean;
  onGenerateHealthPlan?: () => void;
  onSearchLiterature?: () => void;
  onSendQuery?: (query: string) => void;
  className?: string;
}

export function AIAssistant({
  insights,
  isAnalyzing = false,
  onGenerateHealthPlan,
  onSearchLiterature,
  onSendQuery,
  className,
  ...props
}: AIAssistantProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendQuery = async () => {
    if (!query.trim() || !onSendQuery) return;
    
    setIsLoading(true);
    try {
      await onSendQuery(query);
      setQuery("");
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'diagnostic':
        return CheckCircle;
      case 'treatment':
        return Lightbulb;
      case 'warning':
        return AlertTriangle;
      case 'clinical_note':
        return FileText;
      default:
        return Brain;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'diagnostic':
        return 'border-success text-success';
      case 'treatment':
        return 'border-primary text-primary';
      case 'warning':
        return 'border-warning text-warning';
      case 'clinical_note':
        return 'border-muted-foreground text-muted-foreground';
      default:
        return 'border-primary text-primary';
    }
  };

  const getInsightTitle = (type: AIInsight['type']) => {
    switch (type) {
      case 'diagnostic':
        return 'Diagnostic Suggestion';
      case 'treatment':
        return 'Treatment Recommendation';
      case 'warning':
        return 'Clinical Warning';
      case 'clinical_note':
        return 'Clinical Note';
      default:
        return 'AI Insight';
    }
  };

  return (
    <Card className={cn("consultation-card", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            AI Medical Assistant
          </span>
          {isAnalyzing && (
            <Badge variant="secondary" className="animate-pulse">
              Analyzing...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Insights */}
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">AI insights will appear here</p>
              <p className="text-xs">Start consultation to get real-time medical suggestions</p>
            </div>
          ) : (
            insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              const colorClass = getInsightColor(insight.type);
              
              return (
                <div 
                  key={insight.id}
                  className={cn(
                    "bg-card rounded-lg p-4 border-l-4",
                    colorClass.replace('text-', 'border-')
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={cn("w-5 h-5 mt-0.5", colorClass)} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className={cn("text-sm font-semibold", colorClass)}>
                          {getInsightTitle(insight.type)}
                        </h5>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{insight.content}</p>
                      {insight.sources && insight.sources.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Sources: </span>
                          {insight.sources.join(', ')}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {insight.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Query Input */}
        {onSendQuery && (
          <div className="space-y-3">
            <h6 className="text-sm font-medium">Ask AI Assistant</h6>
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask about symptoms, treatments, or medical conditions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="resize-none"
                rows={2}
              />
              <Button
                onClick={handleSendQuery}
                disabled={!query.trim() || isLoading}
                size="sm"
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h6 className="text-sm font-medium">Quick Actions</h6>
          <div className="grid gap-2">
            {onGenerateHealthPlan && (
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={onGenerateHealthPlan}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Health Plan
              </Button>
            )}
            {onSearchLiterature && (
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={onSearchLiterature}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Medical Literature
              </Button>
            )}
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium mb-1">⚠️ Medical AI Assistant Disclaimer</p>
          <p>
            AI suggestions are for informational purposes only and should supplement, 
            not replace, professional medical judgment. Always verify recommendations 
            with current medical guidelines and your clinical expertise.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
