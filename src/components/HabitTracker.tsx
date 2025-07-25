import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completedToday: boolean;
  lastCompleted?: string;
}

export const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedHabits = localStorage.getItem('elevateMe-habits');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('elevateMe-habits', JSON.stringify(habits));
  }, [habits]);

  const addHabit = () => {
    if (!newHabit.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabit.trim(),
      streak: 0,
      completedToday: false,
    };

    setHabits([...habits, habit]);
    setNewHabit('');
    toast({
      title: "Habit Added!",
      description: `"${habit.name}" has been added to your habits.`,
    });
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const today = new Date().toDateString();
        const wasCompletedToday = habit.lastCompleted === today;
        
        return {
          ...habit,
          completedToday: !wasCompletedToday,
          lastCompleted: !wasCompletedToday ? today : undefined,
          streak: !wasCompletedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1)
        };
      }
      return habit;
    }));

    const habit = habits.find(h => h.id === id);
    if (habit) {
      toast({
        title: habit.completedToday ? "Habit Unchecked" : "Great Job!",
        description: habit.completedToday 
          ? `"${habit.name}" marked as incomplete.`
          : `"${habit.name}" completed! Keep up the streak!`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            Add New Habit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter a new habit..."
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1"
            />
            <Button onClick={addHabit} className="bg-gradient-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {habits.map((habit) => (
          <Card key={habit.id} className="bg-gradient-card shadow-card-shadow hover:shadow-elevation transition-all duration-200">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={habit.completedToday ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleHabit(habit.id)}
                  className={habit.completedToday ? "bg-gradient-success" : ""}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <div>
                  <h3 className={`font-medium ${habit.completedToday ? 'line-through text-muted-foreground' : ''}`}>
                    {habit.name}
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {habit.streak} day streak
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {habits.length === 0 && (
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No habits yet. Add your first habit above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};