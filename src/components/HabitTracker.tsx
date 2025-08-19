import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Plus, Trash2, Target, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataRefresh } from '@/contexts/DataRefreshContext';

interface Habit {
  id: string;
  user_id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  last_completed?: string;
}

export const HabitTracker = forwardRef<{ loadHabits: () => void }>((props, ref) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshAllData } = useDataRefresh();

  useEffect(() => {
    loadHabits();
  }, []);

  useImperativeHandle(ref, () => ({
    loadHabits
  }));

  const loadHabits = async () => {
    setLoading(true);
    try {
      // Load from localStorage
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits);
        setHabits(parsedHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a habit name",
        variant: "destructive",
      });
      return;
    }

    const habitData = {
      id: crypto.randomUUID(),
      user_id: 'user',
      name: newHabitName.trim(),
      streak: 0,
      completed_today: false,
      last_completed: undefined,
    };

    try {
      // Save to localStorage
      const savedHabits = localStorage.getItem('habits');
      const existingHabits = savedHabits ? JSON.parse(savedHabits) : [];
      const updatedHabits = [...existingHabits, habitData];
      localStorage.setItem('habits', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);

      setNewHabitName('');
      toast({
        title: "Habit added!",
        description: `"${habitData.name}" has been added to your habits.`,
      });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({
        title: "Error",
        description: "Failed to add habit",
        variant: "destructive",
      });
    }
  };

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    const isCompletingToday = !habit.completed_today;
    
    let newStreak = habit.streak;
    
    if (isCompletingToday) {
      // If completing today, check if we need to increment streak
      if (habit.last_completed) {
        const lastCompleted = new Date(habit.last_completed);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // If last completed was yesterday, increment streak
        if (lastCompleted.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          newStreak = habit.streak + 1;
        } else {
          // If there was a gap, reset streak to 1
          newStreak = 1;
        }
      } else {
        // First time completing, start streak at 1
        newStreak = 1;
      }
    } else {
      // If uncompleting today, decrement streak but don't go below 0
      newStreak = Math.max(0, habit.streak - 1);
    }

    const updatedHabit = {
      ...habit,
      completed_today: isCompletingToday,
      streak: newStreak,
      last_completed: isCompletingToday ? today : habit.last_completed,
    };

    try {
      // Update localStorage
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        const existingHabits = JSON.parse(savedHabits);
        const updatedHabits = existingHabits.map((h: Habit) => 
          h.id === habitId ? updatedHabit : h
        );
        localStorage.setItem('habits', JSON.stringify(updatedHabits));
        setHabits(updatedHabits);
        
        // Trigger insights refresh
        refreshAllData();
      }

      toast({
        title: isCompletingToday ? "Great job!" : "Habit unchecked",
        description: isCompletingToday 
          ? `You've completed "${habit.name}" today! Streak: ${newStreak}` 
          : `"${habit.name}" marked as incomplete`,
      });
    } catch (error) {
      console.error('Error toggling habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      // Remove from localStorage
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        const existingHabits = JSON.parse(savedHabits);
        const updatedHabits = existingHabits.filter((h: Habit) => h.id !== habitId);
        localStorage.setItem('habits', JSON.stringify(updatedHabits));
        setHabits(updatedHabits);
      }

      toast({
        title: "Habit deleted",
        description: `"${habit.name}" has been removed from your habits.`,
      });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Add New Habit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1"
            />
            <Button onClick={addHabit}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => (
          <Card key={habit.id} className={habit.completed_today ? 'bg-green-50 dark:bg-green-950' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium truncate">{habit.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteHabit(habit.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <Badge variant="secondary">{habit.streak}</Badge>
                </div>
                {habit.completed_today && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
              
              <Button
                onClick={() => toggleHabit(habit.id)}
                variant={habit.completed_today ? "default" : "outline"}
                className="w-full"
              >
                {habit.completed_today ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  'Mark Complete'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {habits.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No habits added yet. Create your first habit above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});