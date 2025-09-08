import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { MoodEntry } from "@shared/schema";
import { useState, useMemo } from "react";

export default function MoodChart() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: moodEntries, isLoading } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood-entries"],
  });

  const filteredEntries = useMemo(() => {
    if (!moodEntries) return [];
    
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return moodEntries.filter(entry => new Date(entry.recordedAt) >= cutoffDate);
  }, [moodEntries, timeRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="text-mood-trends">Mood Trends</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={timeRange === '7d' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setTimeRange('7d')}
              data-testid="button-7d"
            >
              7D
            </Button>
            <Button 
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setTimeRange('30d')}
              data-testid="button-30d"
            >
              30D
            </Button>
            <Button 
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setTimeRange('90d')}
              data-testid="button-90d"
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="chart-container rounded-lg p-4 h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading mood data...</p>
            </div>
          ) : filteredEntries?.length === 0 ? (
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-primary/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-mood-data">
                No mood data yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start tracking your mood to see trends over time
              </p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                  <p className="text-sm" data-testid="text-chart-placeholder">
                    Mood chart visualization would be displayed here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredEntries?.length} mood entries in last {timeRange.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
