import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataRefresh } from '@/contexts/DataRefreshContext';

interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood?: string;
}

export const Journal = forwardRef<{ loadEntries: () => void }>((props, ref) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshAllData } = useDataRefresh();

  const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '💪', label: 'Motivated' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '😔', label: 'Sad' },
    { emoji: '😡', label: 'Frustrated' },
  ];

  useEffect(() => {
    loadEntries();
  }, []);

  useImperativeHandle(ref, () => ({
    loadEntries
  }));

  const loadEntries = async () => {
    setLoading(true);
    try {
      // Load from localStorage
      const savedEntries = localStorage.getItem('journal_entries');
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        // Sort by date (newest first)
        parsedEntries.sort((a: JournalEntry, b: JournalEntry) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setEntries(parsedEntries);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.trim()) return;

    const entryData = {
      id: crypto.randomUUID(),
      user_id: 'user',
      date: new Date().toISOString().split('T')[0],
      content: newEntry.trim(),
      mood: selectedMood || undefined,
    };

    try {
      // Save to localStorage
      const savedEntries = localStorage.getItem('journal_entries');
      const existingEntries = savedEntries ? JSON.parse(savedEntries) : [];
      const updatedEntries = [entryData, ...existingEntries];
      localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
      setEntries(updatedEntries);

      setNewEntry('');
      setSelectedMood('');
      
      toast({
        title: "Entry added!",
        description: "Your journal entry has been saved.",
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "Failed to add journal entry",
        variant: "destructive",
      });
    }
  };

  const removeEntry = async (id: string) => {
    try {
      // Remove from localStorage
      const savedEntries = localStorage.getItem('journal_entries');
      if (savedEntries) {
        const existingEntries = JSON.parse(savedEntries);
        const updatedEntries = existingEntries.filter((entry: JournalEntry) => entry.id !== id);
        localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
        setEntries(updatedEntries);
      }

      toast({
        title: "Entry deleted",
        description: "Your journal entry has been removed.",
      });
    } catch (error) {
      console.error('Error removing entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading journal entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5" />
            New Journal Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">How are you feeling?</label>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <Button
                  key={mood.label}
                  variant={selectedMood === mood.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMood(selectedMood === mood.label ? '' : mood.label)}
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
          
          <Button onClick={addEntry} className="w-full">
            Save Entry
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Journal History</h3>
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
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
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No journal entries yet. Start documenting your journey above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});