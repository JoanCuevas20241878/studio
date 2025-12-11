'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AISuggestionsProps = {
  suggestions: {
    alerts: string[];
    recommendations: string[];
  } | null;
  isLoading: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
};

export function AISuggestions({ suggestions, isLoading, onGenerate, canGenerate }: AISuggestionsProps) {
  const { t } = useLocale();

  const generateButton = (
    <Button onClick={onGenerate} disabled={isLoading || !canGenerate}>
      {isLoading ? (
        <>
          <Loader className="mr-2 h-4 w-4" />
          {t.generating}...
        </>
      ) : (
        <>
          <Lightbulb className="mr-2 h-4 w-4" />
          {t.generateTips}
        </>
      )}
    </Button>
  );

  if (!suggestions) {
    return (
        <Card className="bg-accent/30 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      {t.aiSavingsTips}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={!canGenerate ? 0 : -1}>
                            {generateButton}
                          </span>
                        </TooltipTrigger>
                        {!canGenerate && (
                          <TooltipContent>
                            <p>{t.aiTipsPlaceholder}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center pt-4">{t.clickGenerateToSeeTips}</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                {t.aiSavingsTips}
            </div>
            {generateButton}
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
