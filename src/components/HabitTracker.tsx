import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Habit</CardTitle>
          <CardDescription>Track your daily habits and build lasting routines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              className="flex-1"
            />
            <Button onClick={addHabit} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No habits added yet. Start by adding your first habit!</p>
            </CardContent>
          </Card>
        ) : (
          habits.map((habit) => (
            <Card key={habit.id} className={`relative ${habit.completed_today ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{habit.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHabit(habit.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Streak</span>
                    <span className="text-2xl font-bold text-primary">{habit.streak}</span>
                  </div>
                  
                  <Button
                    onClick={() => toggleHabit(habit.id)}
                    variant={habit.completed_today ? "default" : "outline"}
                    className="w-full"
                  >
                    {habit.completed_today ? "✓ Completed Today" : "Mark Complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};