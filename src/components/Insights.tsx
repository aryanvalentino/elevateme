import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface HabitData {
  id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  last_completed?: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood?: string;
}

interface WeeklyHabitData {
  day: string;
  completed: number;
  total: number;
  percentage: number;
}

interface MoodData {
  mood: string;
  count: number;
  fill: string;
}

const moodColors = {
  "😊": "#10B981", // green
  "😐": "#F59E0B", // yellow
  "😔": "#EF4444", // red
  "😴": "#6366F1", // blue
  "😤": "#F97316", // orange
} as const;

const chartConfig = {
  completed: {
    label: "Completed Habits",
    color: "hsl(var(--primary))"
  },
  mood: {
    label: "Mood Distribution",
    color: "hsl(var(--primary))"
  }
};

export const Insights = forwardRef<{ loadInsights: () => void }>((props, ref) => {
  const [weeklyHabits, setWeeklyHabits] = useState<WeeklyHabitData[]>([]);
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Get last 7 days starting from Monday
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1; // Days since last Monday
      
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - mondayOffset + i);
        weekDays.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }

      // Load habits data
      const habitsData = localStorage.getItem('habits');
      const habits: HabitData[] = habitsData ? JSON.parse(habitsData) : [];

      // Determine current week range (Mon - Sun)
      const mondayDate = new Date(weekDays[0].date);
      const sundayDate = new Date(weekDays[6].date);
      sundayDate.setHours(23,59,59,999);

      // Initialize completion counts per day (index 0..6 for Mon..Sun)
      const completedCounts = Array(7).fill(0) as number[];
      const totalHabits = habits.length;

      const todayDateOnly = new Date();
      todayDateOnly.setHours(0,0,0,0);

      habits.forEach((habit) => {
        let streak = habit.streak || 0;
        let lastCompletedDate: Date | undefined = habit.last_completed ? new Date(habit.last_completed) : undefined;

        // Handle cases where UI state might be toggled today
        const lastIsToday = lastCompletedDate && lastCompletedDate.toDateString() === todayDateOnly.toDateString();
        if (habit.completed_today) {
          // Ensure at least today counts once
          if (!lastIsToday) {
            lastCompletedDate = new Date(todayDateOnly);
            streak = Math.max(streak, 1);
          }
        } else if (lastIsToday) {
          // If unchecked today, move the last completion to yesterday and reduce streak
          lastCompletedDate = new Date(todayDateOnly);
          lastCompletedDate.setDate(lastCompletedDate.getDate() - 1);
          streak = Math.max(streak - 1, 0);
        }

        if (!lastCompletedDate || streak <= 0) return;

        for (let k = 0; k < streak; k++) {
          const d = new Date(lastCompletedDate);
          d.setDate(d.getDate() - k);
          d.setHours(12,0,0,0); // normalize
          if (d >= mondayDate && d <= sundayDate) {
            const dayIndex = Math.floor((d.getTime() - new Date(mondayDate).setHours(12,0,0,0)) / (1000*60*60*24));
            if (dayIndex >= 0 && dayIndex < 7) {
              completedCounts[dayIndex] += 1;
            }
          }
        }
      });

      const weeklyHabitsData = weekDays.map((day, idx) => {
        const completed = completedCounts[idx] || 0;
        return {
          day: day.dayName,
          completed,
          total: totalHabits,
          percentage: totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0,
        };
      });

      // Load journal entries for mood analysis
      const journalData = localStorage.getItem('journal_entries');
      const entries: JournalEntry[] = journalData ? JSON.parse(journalData) : [];

      // Filter entries from last 7 days and count moods
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const recentEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= today;
      });

      const moodCounts: Record<string, number> = {};
      recentEntries.forEach(entry => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
      });

      const moodChartData = Object.entries(moodCounts).map(([mood, count]) => ({
        mood,
        count,
        fill: moodColors[mood as keyof typeof moodColors] || "#8B5CF6"
      }));

      setWeeklyHabits(weeklyHabitsData);
      setMoodData(moodChartData);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  // Set up midnight timer to refresh data when day changes
  useEffect(() => {
    const setupMidnightTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const timer = setTimeout(() => {
        loadInsights(); // Refresh data at midnight
        setupMidnightTimer(); // Set up next day's timer
      }, msUntilMidnight);
      
      return timer;
    };
    
    const timer = setupMidnightTimer();
    return () => clearTimeout(timer);
  }, []);

  // Expose loadInsights method to parent
  if (ref) {
    (ref as any).current = { loadInsights };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading insights...</div>
      </div>
    );
  }

  const totalHabits = weeklyHabits.length > 0 ? weeklyHabits[weeklyHabits.length - 1].total : 0;
  const avgCompletion = weeklyHabits.length > 0 
    ? Math.round(weeklyHabits.reduce((acc, day) => acc + day.percentage, 0) / weeklyHabits.length)
    : 0;
  const totalMoodEntries = moodData.reduce((acc, mood) => acc + mood.count, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHabits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletion}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMoodEntries}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Habit Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Habit Completion</CardTitle>
          <p className="text-sm text-muted-foreground">Habits completed each day (Mon–Sun)</p>
        </CardHeader>
        <CardContent className="pl-2 pr-2 sm:pl-6 sm:pr-6">
          {weeklyHabits.length > 0 ? (
            <div className="w-full">
              <ChartContainer 
                config={chartConfig} 
                className={`w-full ${totalHabits > 4 ? 'h-[280px]' : 'h-[220px]'} min-h-[200px]`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={weeklyHabits}
                    margin={{ top: 20, right: 10, left: -10, bottom: 20 }}
                  >
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, totalHabits === 0 ? 6 : Math.max(Math.ceil(totalHabits), 1)]}
                      allowDecimals={false}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        `${value}`,
                        "Habits Completed"
                      ]}
                    />
                    <Bar 
                      dataKey="completed" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <div className={`${totalHabits > 4 ? 'h-[280px]' : 'h-[220px]'} flex items-center justify-center text-muted-foreground`}>
              No habit data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Mood Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">Your mood patterns from journal entries this week</p>
        </CardHeader>
        <CardContent>
          {moodData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodData}
                      dataKey="count"
                      nameKey="mood"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ mood, count }) => `${mood} ${count}`}
                    >
                      {moodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-2">
                <h4 className="font-medium">Mood Breakdown</h4>
                {moodData.map((mood, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: mood.fill }}
                      />
                      <span>{mood.mood}</span>
                    </div>
                    <span className="font-medium">{mood.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No mood data available yet. Add some journal entries with moods!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});