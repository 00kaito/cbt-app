import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { MoodEntry } from "@shared/schema";
import { useState, useMemo } from "react";

// Simple line chart component for mood visualization  
const MoodLineChart = ({ entries, timeRange }: { entries: any[], timeRange: string }) => {
  const chartData = useMemo(() => {
    // Sort entries by date and prepare chart points
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sortedEntries.map((entry, index) => ({
      x: index,
      y: entry.moodLevel,
      date: new Date(entry.createdAt).toLocaleDateString('pl-PL', { 
        month: 'short', 
        day: 'numeric' 
      }),
      level: entry.moodLevel
    }));
  }, [entries]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No mood data for this period</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const width = 100;
  const height = 80;
  const padding = 10;
  
  // Scale Y values (mood levels 1-7) to chart height
  const scaleY = (level: number) => {
    return height - padding - ((level - 1) / 6) * (height - 2 * padding);
  };
  
  // Scale X values to chart width
  const scaleX = (index: number) => {
    return padding + (index / Math.max(chartData.length - 1, 1)) * (width - 2 * padding);
  };

  // Create SVG path for the line
  const pathData = chartData.map((point, index) => {
    const x = scaleX(point.x);
    const y = scaleY(point.y);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full relative">
      {/* Chart title and info */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {chartData.length} mood entries in last {timeRange.toUpperCase()}
          </p>
          {chartData.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Latest: Level {chartData[chartData.length - 1]?.level} on {chartData[chartData.length - 1]?.date}
            </p>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative h-40 w-full bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full"
          data-testid="mood-svg-chart"
        >
          {/* Grid lines for mood levels */}
          {[1, 2, 3, 4, 5, 6, 7].map(level => (
            <line
              key={level}
              x1={padding}
              y1={scaleY(level)}
              x2={width - padding}
              y2={scaleY(level)}
              stroke="currentColor"
              strokeWidth="0.2"
              className="text-muted-foreground/20"
            />
          ))}
          
          {/* Main line path */}
          <path
            d={pathData}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => {
            const isLast = index === chartData.length - 1;
            return (
              <circle
                key={index}
                cx={scaleX(point.x)}
                cy={scaleY(point.y)}
                r={isLast ? "1.5" : "1"}
                fill={isLast ? "hsl(var(--primary))" : "hsl(var(--primary))"}
                className={isLast ? "drop-shadow-md" : ""}
                data-testid={`mood-point-${index}`}
              >
                <title>{`${point.date}: Level ${point.level}`}</title>
              </circle>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4 text-xs text-muted-foreground">
          {[7, 6, 5, 4, 3, 2, 1].map(level => (
            <div key={level} className="flex items-center">
              <span className="w-3 text-right">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
    
    return moodEntries.filter(entry => {
      if (!entry.createdAt) return false;
      try {
        return new Date(entry.createdAt) >= cutoffDate;
      } catch (error) {
        console.error('Invalid date in mood entry:', entry);
        return false;
      }
    });
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
            <div className="w-full h-full">
              <MoodLineChart entries={filteredEntries} timeRange={timeRange} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
