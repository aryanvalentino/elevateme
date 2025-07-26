import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Trash2, Check, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocalNotifications } from '@capacitor/local-notifications';

interface TimeSlot {
  id: string;
  user_id: string;
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
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();
  const { user, isGuest } = useAuth();

  // Check notification permissions on load
  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const permission = await LocalNotifications.checkPermissions();
      setNotificationsEnabled(permission.display === 'granted');
    } catch (error) {
      console.log('Notifications not available on this platform');
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        setNotificationsEnabled(true);
        toast({
          title: "Notifications Enabled!",
          description: "You'll receive reminders for your scheduled activities.",
        });
      } else {
        toast({
          title: "Notifications Denied",
          description: "You won't receive reminders. You can enable them in device settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Notifications Not Available",
        description: "Notifications are not supported on this platform.",
        variant: "destructive",
      });
    }
  };

  const scheduleNotification = async (timeSlot: TimeSlot) => {
    if (!notificationsEnabled) return;

    try {
      // Parse the time slot time (e.g., "09:30 AM") to create a notification time
      const [timeStr, period] = timeSlot.time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      // Create notification for today at the specified time
      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hour24, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Time for your activity! ⏰',
            body: `It's time for: ${timeSlot.activity}`,
            id: parseInt(timeSlot.id),
            schedule: { at: notificationTime },
            actionTypeId: 'OPEN_APP',
            extra: {
              timeSlotId: timeSlot.id,
              activity: timeSlot.activity,
            }
          }
        ]
      });

      console.log(`Notification scheduled for ${timeSlot.time} - ${timeSlot.activity}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelNotification = async (timeSlotId: string) => {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(timeSlotId) }]
      });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  useEffect(() => {
    if (isGuest) {
      const savedTimeSlots = localStorage.getItem('elevateMe-timetable');
      const lastResetDate = localStorage.getItem('elevateMe-timetable-lastReset');
      const today = new Date().toDateString();

      if (savedTimeSlots) {
        const slots = JSON.parse(savedTimeSlots);
        
        // Reset completions if it's a new day
        if (lastResetDate !== today) {
          const resetSlots = slots.map((slot: TimeSlot) => ({ ...slot, completed: false }));
          setTimeSlots(resetSlots);
          localStorage.setItem('elevateMe-timetable-lastReset', today);
        } else {
          setTimeSlots(slots);
        }
      } else {
        localStorage.setItem('elevateMe-timetable-lastReset', today);
      }
      setLoading(false);
    } else if (user) {
      loadTimeSlots();
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem('elevateMe-timetable', JSON.stringify(timeSlots));
    }
  }, [timeSlots, isGuest]);

  const loadTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('time', { ascending: true });

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load timetable",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = async () => {
    if (!hour || !minute || !period || !newActivity.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter time and activity.",
        variant: "destructive",
      });
      return;
    }

    const formattedTime = `${hour}:${minute} ${period}`;

    if (isGuest) {
      // For guests, use localStorage
      const existingSlot = timeSlots.find(slot => slot.time === formattedTime);
      if (existingSlot) {
        toast({
          title: "Time Conflict",
          description: "A time slot already exists for this time.",
          variant: "destructive",
        });
        return;
      }

      const timeSlot: TimeSlot = {
        id: Date.now().toString(),
        user_id: 'guest',
        time: formattedTime,
        activity: newActivity.trim(),
      };

      const updatedSlots = [...timeSlots, timeSlot].sort((a, b) => a.time.localeCompare(b.time));
      setTimeSlots(updatedSlots);
      setHour('');
      setMinute('');
      setPeriod('');
      setNewActivity('');
      
      // Schedule notification for the new time slot
      await scheduleNotification(timeSlot);
      
      toast({
        title: "Time Slot Added!",
        description: `${formattedTime} - ${newActivity} has been added to your timetable.`,
      });
      return;
    }

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('time_slots')
        .insert([
          {
            user_id: user.id,
            time: formattedTime,
            activity: newActivity.trim(),
            completed: false,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const updatedSlots = [...timeSlots, data].sort((a, b) => a.time.localeCompare(b.time));
      setTimeSlots(updatedSlots);
      setHour('');
      setMinute('');
      setPeriod('');
      setNewActivity('');
      
      // Schedule notification for the new time slot
      await scheduleNotification(data);
      
      toast({
        title: "Time Slot Added!",
        description: `${formattedTime} - ${newActivity} has been added to your timetable.`,
      });
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast({
        title: "Error",
        description: "Failed to add time slot",
        variant: "destructive",
      });
    }
  };

  const removeTimeSlot = async (id: string) => {
    // Cancel the notification first
    await cancelNotification(id);
    
    if (isGuest) {
      // For guests, use localStorage
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
      toast({
        title: "Time Slot Removed",
        description: "The time slot has been removed from your timetable.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
      toast({
        title: "Time Slot Removed",
        description: "The time slot has been removed from your timetable.",
      });
    } catch (error) {
      console.error('Error removing time slot:', error);
      toast({
        title: "Error",
        description: "Failed to remove time slot",
        variant: "destructive",
      });
    }
  };

  const toggleCompletion = async (id: string) => {
    const slot = timeSlots.find(s => s.id === id);
    if (!slot) return;

    if (isGuest) {
      // For guests, use localStorage
      setTimeSlots(prev => prev.map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
      ));
      
      toast({
        title: slot.completed ? "Task Unmarked" : "Task Completed!",
        description: `${slot.activity} has been ${slot.completed ? 'unmarked' : 'marked as complete'}.`,
        variant: slot.completed ? "default" : "default",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ completed: !slot.completed })
        .eq('id', id);

      if (error) throw error;

      setTimeSlots(prev => prev.map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
      ));
      
      toast({
        title: slot.completed ? "Task Unmarked" : "Task Completed!",
        description: `${slot.activity} has been ${slot.completed ? 'unmarked' : 'marked as complete'}.`,
        variant: slot.completed ? "default" : "default",
      });
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast({
        title: "Error",
        description: "Failed to update completion status",
        variant: "destructive",
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading timetable...</div>
      </div>
    );
  }

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
          <div className="flex gap-2">
            <Button onClick={addTimeSlot} className="flex-1 bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add to Timetable
            </Button>
            
            {!notificationsEnabled ? (
              <Button 
                variant="outline" 
                onClick={requestNotificationPermissions}
                className="px-3"
                title="Enable notifications to get reminders"
              >
                <BellOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                disabled
                className="px-3"
                title="Notifications enabled"
              >
                <Bell className="h-4 w-4" />
              </Button>
            )}
          </div>
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
