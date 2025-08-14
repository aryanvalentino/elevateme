import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Trash2, CheckCircle2, Bell, BellOff } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useToast } from '@/hooks/use-toast';

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
  const [period, setPeriod] = useState('AM');
  const [activity, setActivity] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTimeSlots();
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
          title: "Notifications enabled!",
          description: "You'll receive reminders for your activities.",
        });
      }
    } catch (error) {
      toast({
        title: "Notifications not available",
        description: "Notifications are not supported on this platform.",
        variant: "destructive",
      });
    }
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12 + '';
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const loadTimeSlots = async () => {
    setLoading(true);
    try {
      // Load from localStorage
      const savedTimeSlots = localStorage.getItem('time_slots');
      if (savedTimeSlots) {
        const parsedTimeSlots = JSON.parse(savedTimeSlots);
        // Sort by time
        parsedTimeSlots.sort((a: TimeSlot, b: TimeSlot) => {
          const timeA = convertTo24Hour(a.time);
          const timeB = convertTo24Hour(b.time);
          return timeA.localeCompare(timeB);
        });
        setTimeSlots(parsedTimeSlots);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async (timeSlot: TimeSlot) => {
    if (!notificationsEnabled) return;

    try {
      const [timeStr, period] = timeSlot.time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hour24, minutes, 0, 0);

      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Time for your activity! ⏰',
            body: `It's time for: ${timeSlot.activity}`,
            id: parseInt(timeSlot.id.replace(/\D/g, '').slice(0, 9)) || Math.floor(Math.random() * 1000000),
            schedule: { at: notificationTime },
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelNotification = async (timeSlotId: string) => {
    try {
      const numericId = parseInt(timeSlotId.replace(/\D/g, '').slice(0, 9)) || Math.floor(Math.random() * 1000000);
      await LocalNotifications.cancel({
        notifications: [{ id: numericId }]
      });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const addTimeSlot = async () => {
    if (!hour || !minute || !activity.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const timeString = `${hour}:${minute.padStart(2, '0')} ${period}`;
    
    const timeSlotData = {
      id: crypto.randomUUID(),
      user_id: 'user',
      time: timeString,
      activity: activity.trim(),
      completed: false,
    };

    try {
      // Save to localStorage
      const savedTimeSlots = localStorage.getItem('time_slots');
      const existingTimeSlots = savedTimeSlots ? JSON.parse(savedTimeSlots) : [];
      const updatedTimeSlots = [...existingTimeSlots, timeSlotData];
      
      // Sort by time
      updatedTimeSlots.sort((a: TimeSlot, b: TimeSlot) => {
        const timeA = convertTo24Hour(a.time);
        const timeB = convertTo24Hour(b.time);
        return timeA.localeCompare(timeB);
      });
      
      localStorage.setItem('time_slots', JSON.stringify(updatedTimeSlots));
      setTimeSlots(updatedTimeSlots);

      // Schedule notification if enabled
      if (notificationsEnabled) {
        scheduleNotification(timeSlotData);
      }

      setHour('');
      setMinute('');
      setPeriod('AM');
      setActivity('');
      
      toast({
        title: "Time slot added!",
        description: `"${timeSlotData.activity}" scheduled for ${timeString}.`,
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
    try {
      // Remove from localStorage
      const savedTimeSlots = localStorage.getItem('time_slots');
      if (savedTimeSlots) {
        const existingTimeSlots = JSON.parse(savedTimeSlots);
        const updatedTimeSlots = existingTimeSlots.filter((slot: TimeSlot) => slot.id !== id);
        localStorage.setItem('time_slots', JSON.stringify(updatedTimeSlots));
        setTimeSlots(updatedTimeSlots);
      }

      // Cancel notification
      cancelNotification(id);

      toast({
        title: "Time slot removed",
        description: "The time slot has been deleted.",
      });
    } catch (error) {
      console.error('Error removing time slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  const toggleCompletion = async (id: string) => {
    const timeSlot = timeSlots.find(slot => slot.id === id);
    if (!timeSlot) return;

    const updatedSlot = { ...timeSlot, completed: !timeSlot.completed };

    try {
      // Update localStorage
      const savedTimeSlots = localStorage.getItem('time_slots');
      if (savedTimeSlots) {
        const existingTimeSlots = JSON.parse(savedTimeSlots);
        const updatedTimeSlots = existingTimeSlots.map((slot: TimeSlot) => 
          slot.id === id ? updatedSlot : slot
        );
        localStorage.setItem('time_slots', JSON.stringify(updatedTimeSlots));
        setTimeSlots(updatedTimeSlots);
      }

      toast({
        title: updatedSlot.completed ? "Task completed!" : "Task unmarked",
        description: `"${timeSlot.activity}" ${updatedSlot.completed ? 'completed' : 'marked as incomplete'}.`,
      });
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({
        title: "Error",
        description: "Failed to update time slot",
        variant: "destructive",
      });
    }
  };

  const getCurrentActivity = () => {
    const now = new Date();
    const currentTime = convertTo24Hour(`${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`);
    
    return timeSlots.find(slot => {
      const slotTime = convertTo24Hour(slot.time);
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

  const currentActivity = getCurrentActivity();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
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
                {['00', '15', '30', '45'].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
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
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTimeSlot()}
              className="md:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={addTimeSlot} className="flex-1">
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

      {currentActivity && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Current Activity</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{currentActivity.time} - {currentActivity.activity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Today's Schedule</h3>
        {timeSlots.map((slot) => (
          <Card key={slot.id} className={slot.completed ? 'bg-green-50 dark:bg-green-950' : ''}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  {slot.time}
                </Badge>
                <span className={slot.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                  {slot.activity}
                </span>
                {slot.completed && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={slot.completed ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCompletion(slot.id)}
                  className={slot.completed ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeSlot(slot.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {timeSlots.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No time slots scheduled. Add your first activity above!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};