'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Lightbulb } from 'lucide-react';

type AISuggestionsProps = {
  suggestions: {
    alerts: string[];
    recommendations: string[];
  } | null;
};

export function AISuggestions({ suggestions }: AISuggestionsProps) {
  if (!suggestions || (suggestions.alerts.length === 0 && suggestions.recommendations.length === 0)) {
    return (
        <Card className="bg-accent/30 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    AI Savings Tips
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Add some expenses and set a budget to start receiving personalized savings tips from our AI advisor.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Savings Tips
        </CardTitle>
        <CardDescription>Personalized advice to help you save more.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Alerts
          </h3>
          {suggestions.alerts.length > 0 ? (
            <ul className="space-y-2 list-disc pl-5 text-sm">
              {suggestions.alerts.map((alert, index) => (
                <li key={`alert-${index}`}>{alert}</li>
              ))}
            </ul>
          ) : (
             <p className="text-sm text-muted-foreground">No alerts for now. Keep up the good work!</p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-500" /> Recommendations
          </h3>
          {suggestions.recommendations.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5 text-sm">
            {suggestions.recommendations.map((rec, index) => (
              <li key={`rec-${index}`}>{rec}</li>
            ))}
          </ul>
           ) : (
             <p className="text-sm text-muted-foreground">No specific recommendations at this time.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
