import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { MoodEntry } from "@shared/schema";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Function to get color based on mood level  
const getMoodColor = (level: number) => {
  if (level <= 2) return "#dc2626"; // red-600 - depression
  if (level <= 3) return "#ea580c"; // orange-600 - low mood  
  if (level === 4) return "#65a30d"; // lime-600 - normal/balanced
  if (level === 5) return "#0891b2"; // cyan-600 - elevation
  if (level === 6) return "#7c3aed"; // violet-600 - hypomania
  return "#be185d"; // pink-600 - mania
};

// Custom dot for the line chart
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  
  const color = getMoodColor(payload.moodLevel);
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={4} 
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
};

// Recharts line chart component for mood visualization  
const MoodLineChart = ({ entries, timeRange }: { entries: any[], timeRange: string }) => {
  const chartData = useMemo(() => {
    // Sort entries by date and prepare chart points
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sortedEntries.map((entry) => ({
      date: new Date(entry.createdAt).toLocaleDateString('pl-PL', { 
        month: 'short', 
        day: 'numeric' 
      }),
      moodLevel: entry.moodLevel,
      fullDate: new Date(entry.createdAt).toLocaleDateString('pl-PL')
    }));
  }, [entries]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No mood data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {chartData.length} mood entries in last {timeRange.toUpperCase()}
        </p>
        {chartData.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Latest: Level {chartData[chartData.length - 1]?.moodLevel} on {chartData[chartData.length - 1]?.date}
          </p>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              domain={[1, 7]}
              ticks={[1, 2, 3, 4, 5, 6, 7]}
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground"
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border rounded p-2 shadow-lg">
                      <p className="text-sm font-medium">{data.fullDate}</p>
                      <p className="text-sm" style={{ color: getMoodColor(data.moodLevel) }}>
                        Mood Level: {data.moodLevel}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="moodLevel" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
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
