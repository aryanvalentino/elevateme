import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
}

export const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const { toast } = useToast();

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '💪', label: 'Motivated' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😔', label: 'Sad' },
    { emoji: '😡', label: 'Frustrated' },
  ];

  useEffect(() => {
    const savedEntries = localStorage.getItem('elevateMe-journal');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('elevateMe-journal', JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
    if (!newEntry.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something in your journal entry.",
        variant: "destructive",
      });
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      content: newEntry.trim(),
      mood: selectedMood,
    };

    setEntries([entry, ...entries]);
    setNewEntry('');
    setSelectedMood('');
    
    toast({
      title: "Journal Entry Added!",
      description: "Your thoughts have been saved to your journal.",
    });
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: "Entry Removed",
      description: "The journal entry has been deleted.",
    });
  };

  const getTodaysEntry = () => {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return entries.find(entry => entry.date === today);
  };

  const todaysEntry = getTodaysEntry();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-info" />
            New Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">How are you feeling today?</label>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <Button
                  key={mood.label}
                  variant={selectedMood === mood.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMood(selectedMood === mood.label ? '' : mood.label)}
                  className={selectedMood === mood.label ? "bg-gradient-primary" : ""}
                >
                  <span className="mr-1">{mood.emoji}</span>
                  {mood.label}
                </Button>
              ))}
            </div>
          </div>
          
          <Textarea
            placeholder="What's on your mind today? Reflect on your day, goals, or thoughts..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          
          <Button onClick={addEntry} className="w-full bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Save Entry
          </Button>
        </CardContent>
      </Card>

      {todaysEntry && (
        <Card className="bg-gradient-success text-success-foreground shadow-elevation">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium mb-1">Today's Entry</p>
                <p className="text-sm opacity-90 line-clamp-2">{todaysEntry.content}</p>
                {todaysEntry.mood && (
                  <Badge variant="secondary" className="mt-2 bg-white/20 text-white">
                    {moods.find(m => m.label === todaysEntry.mood)?.emoji} {todaysEntry.mood}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Journal History</h3>
        {entries.map((entry) => (
          <Card key={entry.id} className="bg-gradient-card shadow-card-shadow hover:shadow-elevation transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.date}
                  </Badge>
                  {entry.mood && (
                    <Badge variant="secondary" className="text-xs">
                      {moods.find(m => m.label === entry.mood)?.emoji} {entry.mood}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm leading-relaxed">{entry.content}</p>
            </CardContent>
          </Card>
        ))}
        
        {entries.length === 0 && (
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No journal entries yet. Start documenting your journey above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};