import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Flame, Target, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Habit {
  id: string;
  user_id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  last_completed?: string;
}

export const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isGuest } = useAuth();

  // Load habits from Supabase on component mount
  useEffect(() => {
    if (isGuest) {
      // For guests, use localStorage
      const savedHabits = localStorage.getItem('elevateMe_habits');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
      setLoading(false);
    } else if (user) {
      loadHabits();
    }
  }, [user, isGuest]);

  // Save to localStorage for guest users
  useEffect(() => {
    if (isGuest) {
      localStorage.setItem('elevateMe_habits', JSON.stringify(habits));
    }
  }, [habits, isGuest]);

  const loadHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (newHabitName.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter a habit name",
        variant: "destructive",
      });
      return;
    }

    if (isGuest) {
      // For guests, use localStorage
      const newHabit: Habit = {
        id: crypto.randomUUID(),
        user_id: 'guest',
        name: newHabitName.trim(),
        streak: 0,
        completed_today: false,
      };
      setHabits([...habits, newHabit]);
      setNewHabitName('');
      toast({
        title: "Success",
        description: "Habit added successfully!",
      });
      return;
    }

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            user_id: user.id,
            name: newHabitName.trim(),
            streak: 0,
            completed_today: false,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setHabits([...habits, data]);
      setNewHabitName('');
      toast({
        title: "Success",
        description: "Habit added successfully!",
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

  const toggleHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    if (isGuest) {
      // For guests, use localStorage
      setHabits(habits.map(h => {
        if (h.id === id) {
          const wasCompleted = h.completed_today;
          const newCompleted = !wasCompleted;
          
          let newStreak = h.streak;
          if (newCompleted) {
            if (h.last_completed !== today) {
              newStreak = h.streak + 1;
            }
          } else {
            if (h.last_completed === today) {
              newStreak = Math.max(0, h.streak - 1);
            }
          }

          return {
            ...h,
            completed_today: newCompleted,
            streak: newStreak,
            last_completed: newCompleted ? today : undefined
          };
        }
        return h;
      }));
      
      toast({
        title: "Success",
        description: "Habit updated!",
      });
      return;
    }

    try {
      const wasCompleted = habit.completed_today;
      const newCompleted = !wasCompleted;
      
      let newStreak = habit.streak;
      if (newCompleted) {
        if (habit.last_completed !== today) {
          newStreak = habit.streak + 1;
        }
      } else {
        if (habit.last_completed === today) {
          newStreak = Math.max(0, habit.streak - 1);
        }
      }

      const { error } = await supabase
        .from('habits')
        .update({
          completed_today: newCompleted,
          streak: newStreak,
          last_completed: newCompleted ? today : null
        })
        .eq('id', id);

      if (error) throw error;

      setHabits(habits.map(h => 
        h.id === id 
          ? {
              ...h,
              completed_today: newCompleted,
              streak: newStreak,
              last_completed: newCompleted ? today : undefined
            }
          : h
      ));

      toast({
        title: "Success",
        description: "Habit updated!",
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (id: string) => {
    if (isGuest) {
      // For guests, use localStorage
      setHabits(habits.filter(habit => habit.id !== id));
      toast({
        title: "Success",
        description: "Habit deleted successfully!",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHabits(habits.filter(habit => habit.id !== id));
      toast({
        title: "Success",
        description: "Habit deleted successfully!",
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <Card className="bg-gradient-card shadow-card-shadow animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg sm:text-xl">Add New Habit</CardTitle>
          </div>
          <CardDescription>Track your daily habits and build lasting routines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Enter habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1 h-11 text-base"
            />
            <Button 
              onClick={addHabit} 
              className="bg-gradient-primary hover:opacity-90 transition-all duration-200 h-11 px-6 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {habits.length === 0 ? (
          <Card className="col-span-full bg-gradient-card shadow-card-shadow animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-base">No habits added yet.</p>
              <p className="text-muted-foreground text-sm mt-1">Start by adding your first habit above!</p>
            </CardContent>
          </Card>
        ) : (
          habits.map((habit, index) => (
            <Card 
              key={habit.id} 
              className={`relative bg-gradient-card shadow-card-shadow hover:shadow-elevation transition-all duration-300 animate-fade-in ${
                habit.completed_today ? 'ring-2 ring-success/50 bg-success/5' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {habit.completed_today ? (
                      <div className="flex-shrink-0 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                        <span className="text-success-foreground text-xs font-bold">✓</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-6 h-6 border-2 border-muted rounded-full" />
                    )}
                    <CardTitle className="text-base sm:text-lg truncate pr-2">{habit.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHabit(habit.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200 flex-shrink-0 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-medium text-muted-foreground">Streak</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{habit.streak}</span>
                  </div>
                  
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground">Today</span>
                    </div>
                    <span className={`text-xl font-bold ${habit.completed_today ? 'text-success' : 'text-muted-foreground'}`}>
                      {habit.completed_today ? '✓' : '○'}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => toggleHabit(habit.id)}
                  variant={habit.completed_today ? "default" : "outline"}
                  className={`w-full h-11 text-base font-medium transition-all duration-200 ${
                    habit.completed_today 
                      ? 'bg-success hover:bg-success/80 text-success-foreground' 
                      : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {habit.completed_today ? (
                    <>
                      <span className="mr-2">✓</span>
                      Completed Today
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};