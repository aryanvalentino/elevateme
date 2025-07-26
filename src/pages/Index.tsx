import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { HabitTracker } from '@/components/HabitTracker';
import { TimetableCreator } from '@/components/TimetableCreator';
import { Journal } from '@/components/Journal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';
import { Target, Clock, BookOpen, TrendingUp } from 'lucide-react';


const Index = () => {
  const [activeTab, setActiveTab] = useState('habits');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-br from-purple-600 to-purple-800 overflow-hidden">
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <UserMenu />
          <ThemeToggle />
        </div>
        <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
          <div className="text-primary-foreground">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">ElevateMe</h1>
            <p className="text-lg md:text-xl opacity-90">Track habits • Schedule time • Reflect daily</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <Card className="bg-gradient-card shadow-elevation">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="habits" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Habits</span>
                </TabsTrigger>
                <TabsTrigger value="timetable" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Timetable</span>
                </TabsTrigger>
                <TabsTrigger value="journal" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Journal</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="habits" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Target className="h-6 w-6 text-primary" />
                    Habit Tracker
                  </h2>
                  <p className="text-muted-foreground">Build positive habits and track your daily progress with streak counters.</p>
                </div>
                <HabitTracker />
              </TabsContent>

              <TabsContent value="timetable" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Clock className="h-6 w-6 text-info" />
                    Daily Timetable
                  </h2>
                  <p className="text-muted-foreground">Create and manage your daily schedule with custom time slots and activities.</p>
                </div>
                <TimetableCreator />
              </TabsContent>

              <TabsContent value="journal" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <BookOpen className="h-6 w-6 text-accent" />
                    Personal Journal
                  </h2>
                  <p className="text-muted-foreground">Reflect on your day, capture thoughts, and track your mood and progress.</p>
                </div>
                <Journal />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Keep growing with ElevateMe
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;