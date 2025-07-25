import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  id: string;
  time: string;
  activity: string;
}

export const TimetableCreator = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newTime, setNewTime] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedTimeSlots = localStorage.getItem('elevateMe-timetable');
    if (savedTimeSlots) {
      setTimeSlots(JSON.parse(savedTimeSlots));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('elevateMe-timetable', JSON.stringify(timeSlots));
  }, [timeSlots]);

  const addTimeSlot = () => {
    if (!newTime.trim() || !newActivity.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both time and activity.",
        variant: "destructive",
      });
      return;
    }

    const timeSlot: TimeSlot = {
      id: Date.now().toString(),
      time: newTime,
      activity: newActivity.trim(),
    };

    const updatedSlots = [...timeSlots, timeSlot].sort((a, b) => a.time.localeCompare(b.time));
    setTimeSlots(updatedSlots);
    setNewTime('');
    setNewActivity('');
    
    toast({
      title: "Time Slot Added!",
      description: `${newTime} - ${newActivity} has been added to your timetable.`,
    });
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    toast({
      title: "Time Slot Removed",
      description: "The time slot has been removed from your timetable.",
    });
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return timeSlots.find(slot => {
      const slotTime = slot.time;
      return slotTime <= currentTime;
    });
  };

  const currentSlot = getCurrentTimeSlot();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Add Time Slot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="Select time"
            />
            <Input
              placeholder="Enter activity..."
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTimeSlot()}
              className="md:col-span-2"
            />
          </div>
          <Button onClick={addTimeSlot} className="w-full bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add to Timetable
          </Button>
        </CardContent>
      </Card>

      {currentSlot && (
        <Card className="bg-gradient-primary text-primary-foreground shadow-elevation">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">Current Activity</p>
                <p className="text-sm opacity-90">{currentSlot.time} - {currentSlot.activity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Today's Schedule</h3>
        {timeSlots.map((slot) => (
          <Card key={slot.id} className="bg-gradient-card shadow-card-shadow hover:shadow-elevation transition-all duration-200">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  {slot.time}
                </Badge>
                <span className="font-medium">{slot.activity}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTimeSlot(slot.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {timeSlots.length === 0 && (
          <Card className="bg-gradient-card shadow-card-shadow">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No time slots scheduled. Add your first activity above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};