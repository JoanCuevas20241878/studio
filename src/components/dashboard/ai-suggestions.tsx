'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

type AISuggestionsProps = {
  suggestions: {
    alerts: string[];
    recommendations: string[];
  } | null;
};

export function AISuggestions({ suggestions }: AISuggestionsProps) {
  const { t } = useLocale();
  if (!suggestions || (suggestions.alerts.length === 0 && suggestions.recommendations.length === 0)) {
    return (
        <Card className="bg-accent/30 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    {t.aiSavingsTips}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{t.aiTipsPlaceholder}</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {t.aiSavingsTips}
        </CardTitle>
        <CardDescription>{t.aiTipsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> {t.alerts}
          </h3>
          {suggestions.alerts.length > 0 ? (
            <ul className="space-y-2 list-disc pl-5 text-sm">
              {suggestions.alerts.map((alert, index) => (
                <li key={`alert-${index}`}>{alert}</li>
              ))}
            </ul>
          ) : (
             <p className="text-sm text-muted-foreground">{t.noAlerts}</p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-500" /> {t.recommendations}
          </h3>
          {suggestions.recommendations.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5 text-sm">
            {suggestions.recommendations.map((rec, index) => (
              <li key={`rec-${index}`}>{rec}</li>
            ))}
          </ul>
           ) : (
             <p className="text-sm text-muted-foreground">{t.noRecommendations}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
