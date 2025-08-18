import { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HabitTracker } from "@/components/HabitTracker";
import { TimetableCreator } from "@/components/TimetableCreator";
import { Journal } from "@/components/Journal";
import { Insights } from "@/components/Insights";
import { DataRefreshProvider } from "@/contexts/DataRefreshContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("habits");
  const habitTrackerRef = useRef<{ loadHabits: () => void }>(null);
  const journalRef = useRef<{ loadEntries: () => void }>(null);
  const timetableRef = useRef<{ loadTimeSlots: () => void }>(null);
  const insightsRef = useRef<{ loadInsights: () => void }>(null);

  const handleDataRefresh = useCallback(() => {
    // Trigger reload for all components
    habitTrackerRef.current?.loadHabits();
    journalRef.current?.loadEntries();
    timetableRef.current?.loadTimeSlots();
    insightsRef.current?.loadInsights();
  }, []);

  return (
    <DataRefreshProvider onRefresh={handleDataRefresh}>
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground pt-12 pb-6 px-6 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-white">ElevateMe</h1>
              <p className="text-sm mt-1 text-white/80">Track habits • Schedule time • Reflect daily</p>
            </div>
            <div className="flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="habits">
                Habits
              </TabsTrigger>
              <TabsTrigger value="timetable">
                Timetable
              </TabsTrigger>
              <TabsTrigger value="journal">
                Journal
              </TabsTrigger>
              <TabsTrigger value="insights">
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="habits" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Habit Tracker</h2>
                <p className="text-muted-foreground">Build positive habits and track your daily progress with streak counters.</p>
              </div>
              <HabitTracker ref={habitTrackerRef} />
            </TabsContent>

            <TabsContent value="timetable" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Daily Timetable</h2>
                <p className="text-muted-foreground">Create and manage your daily schedule with custom time slots and activities.</p>
              </div>
              <TimetableCreator ref={timetableRef} />
            </TabsContent>

            <TabsContent value="journal" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Personal Journal</h2>
                <p className="text-muted-foreground">Reflect on your day, capture thoughts, and track your mood and progress.</p>
              </div>
              <Journal ref={journalRef} />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Weekly Insights</h2>
                <p className="text-muted-foreground">Visualize your progress with habit completion rates and mood trends.</p>
              </div>
              <Insights ref={insightsRef} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DataRefreshProvider>
  );
};

export default Index;