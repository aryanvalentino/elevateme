import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  id: string;
  time: string;
  activity: string;
  completed?: boolean;
}

export const TimetableCreator = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('');
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
    if (!hour || !minute || !period || !newActivity.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter time and activity.",
        variant: "destructive",
      });
      return;
    }

    const formattedTime = `${hour}:${minute} ${period}`;
    const timeSlot: TimeSlot = {
      id: Date.now().toString(),
      time: formattedTime,
      activity: newActivity.trim(),
    };

    const updatedSlots = [...timeSlots, timeSlot].sort((a, b) => a.time.localeCompare(b.time));
    setTimeSlots(updatedSlots);
    setHour('');
    setMinute('');
    setPeriod('');
    setNewActivity('');
    
    toast({
      title: "Time Slot Added!",
      description: `${formattedTime} - ${newActivity} has been added to your timetable.`,
    });
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    toast({
      title: "Time Slot Removed",
      description: "The time slot has been removed from your timetable.",
    });
  };

  const toggleCompletion = (id: string) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === id ? { ...slot, completed: !slot.completed } : slot
    ));
    
    const slot = timeSlots.find(s => s.id === id);
    if (slot) {
      toast({
        title: slot.completed ? "Task Unmarked" : "Task Completed!",
        description: `${slot.activity} has been ${slot.completed ? 'unmarked' : 'marked as complete'}.`,
        variant: slot.completed ? "default" : "default",
      });
    }
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger>
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                    {h.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger>
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
            
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
          <Card key={slot.id} className={`bg-gradient-card shadow-card-shadow hover:shadow-elevation transition-all duration-200 ${slot.completed ? 'opacity-60' : ''}`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  {slot.time}
                </Badge>
                <span className={`font-medium ${slot.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {slot.activity}
                </span>
                {slot.completed && (
                  <Badge variant="secondary" className="bg-success text-success-foreground">
                    Completed
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={slot.completed ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCompletion(slot.id)}
                  className={slot.completed ? "bg-success hover:bg-success/80" : ""}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeSlot(slot.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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