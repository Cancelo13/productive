import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Download, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTodos } from "@/hooks/use-todos";
import { useGoals } from "@/hooks/use-goals-habits";
import { useHabits } from "@/hooks/use-goals-habits";
import { useWorkSessions } from "@/hooks/use-work-sessions";
import { useTheme } from "@/components/theme-provider";

interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  soundNotifications: boolean;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  timer: TimerSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  timer: {
    focusDuration: 25,
    shortBreakDuration: 5,
    soundNotifications: true
  }
};

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const { theme: currentTheme, setTheme: setAppTheme, mounted: themeMounted } = useTheme();
  const { data: todos } = useTodos();
  const { data: goals } = useGoals();
  const { data: habits } = useHabits();
  const { data: workSessions } = useWorkSessions();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme }));
    setAppTheme(theme);
  };

  const updateTimerSetting = (key: keyof TimerSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        [key]: value
      }
    }));
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        data: {
          todos: todos || [],
          goals: goals || [],
          habits: habits || [],
          workSessions: workSessions || []
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `productivity-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and application settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-full">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Theme Preference</p>
                <p className="text-sm text-muted-foreground">Select your preferred color theme.</p>
              </div>
            </div>
            <Select value={currentTheme} onValueChange={(value: 'light' | 'dark' | 'system') => updateTheme(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timer Settings</CardTitle>
          <CardDescription>Configure your focus and break durations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Focus Duration (minutes)</Label>
              <Select value={settings.timer.focusDuration.toString()} onValueChange={(value) => updateTimerSetting('focusDuration', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Short Break Duration (minutes)</Label>
              <Select value={settings.timer.shortBreakDuration.toString()} onValueChange={(value) => updateTimerSetting('shortBreakDuration', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">Play a sound when timer ends.</p>
              </div>
            </div>
            <Switch 
              checked={settings.timer.soundNotifications} 
              onCheckedChange={(checked) => updateTimerSetting('soundNotifications', checked)} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Control your data and exports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">Download a JSON copy of all your tasks and goals.</p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={exportData}
              disabled={isExporting}
            >
              <Download className="w-4 h-4" /> 
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
