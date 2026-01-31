import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Timer, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreateWorkSession, useUpdateWorkSession, useWorkSessions } from "@/hooks/use-work-sessions";
import { format } from "date-fns";

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

type TimerState = "idle" | "running" | "paused";
type SessionType = "focus" | "break";

export function WorkTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Will be updated from settings
  const [state, setState] = useState<TimerState>("idle");
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalElapsed, setTotalElapsed] = useState(0); // Track total elapsed time in seconds
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const createSession = useCreateWorkSession();
  const updateSession = useUpdateWorkSession();
  const { data: workSessions } = useWorkSessions();

  // Load settings from localStorage
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
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted");
        }
      });
    }
  }, []);

  // Update timer duration when settings change or session type changes (only when idle)
  useEffect(() => {
    if (state === 'idle') {
      const duration = sessionType === 'focus' 
        ? settings.timer.focusDuration 
        : settings.timer.shortBreakDuration;
      setTimeLeft(duration * 60);
    }
  }, [settings.timer.focusDuration, settings.timer.shortBreakDuration, sessionType, state]);

  const handleCompleteSession = async (sessionId: number, startTime: Date) => {
    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const durationInMinutes = Math.round(durationInSeconds / 60);
    
    await updateSession.mutateAsync({
      id: sessionId,
      endTime: endTime.toISOString(),
      duration: durationInMinutes,
    });
  };

  // Load persisted state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('workTimerState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setTimeLeft(parsed.timeLeft || 25 * 60);
        setState(parsed.state || 'idle');
        setSessionType(parsed.sessionType || 'focus');
        setCurrentSessionId(parsed.currentSessionId || null);
        setSessionStartTime(parsed.sessionStartTime ? new Date(parsed.sessionStartTime) : null);
        setTotalElapsed(parsed.totalElapsed || 0);
        
        // If there's a running session, check if it's still valid
        if (parsed.state === 'running' && parsed.currentSessionId && parsed.sessionStartTime) {
          const sessionAge = Date.now() - new Date(parsed.sessionStartTime).getTime();
          const sessionTimeLeft = parsed.timeLeft;
          
          // If session is older than the time left, it likely completed while app was closed
          if (sessionAge > sessionTimeLeft * 1000) {
            // Session completed while app was closed
            handleCompleteSession(parsed.currentSessionId, parsed.sessionStartTime);
            setState('idle');
            setTimeLeft(parsed.sessionType === 'focus' ? 25 * 60 : 5 * 60);
            setCurrentSessionId(null);
            setSessionStartTime(null);
            setTotalElapsed(0);
            saveTimerState('idle', parsed.sessionType || 'focus', null, null, 0, parsed.sessionType === 'focus' ? 25 * 60 : 5 * 60);
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    }
  }, []); // Only run once on mount

  // Save state to localStorage whenever it changes
  const saveTimerState = (newState: TimerState, newSessionType: SessionType, sessionId: number | null, startTime: Date | null, elapsed: number, newTimeLeft: number) => {
    const stateToSave = {
      state: newState,
      sessionType: newSessionType,
      currentSessionId: sessionId,
      sessionStartTime: startTime?.toISOString() || null,
      totalElapsed: elapsed,
      timeLeft: newTimeLeft
    };
    localStorage.setItem('workTimerState', JSON.stringify(stateToSave));
  };

  // Update localStorage when state changes
  useEffect(() => {
    saveTimerState(state, sessionType, currentSessionId, sessionStartTime, totalElapsed, timeLeft);
  }, [state, sessionType, currentSessionId, sessionStartTime, totalElapsed, timeLeft]);

  // Handle timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalElapsed(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && state === "running") {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [state, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (state === "idle") {
      // Start new session
      const now = new Date();
      const newSession = await createSession.mutateAsync({
        startTime: now.toISOString(),
        duration: 0, // Will update at end
      });
      setCurrentSessionId(newSession.id);
      setSessionStartTime(now);
      setTotalElapsed(0);
    }
    setState("running");
  };

  const handlePause = () => {
    setState("paused");
  };

  const handleStop = async () => {
    if (currentSessionId && sessionStartTime) {
      await handleCompleteSession(currentSessionId, sessionStartTime);
    }
    
    setState("idle");
    setTimeLeft(sessionType === "focus" ? 25 * 60 : 5 * 60);
    setCurrentSessionId(null);
    setSessionStartTime(null);
    setTotalElapsed(0);
  };

  const handleComplete = async () => {
    if (currentSessionId && sessionStartTime) {
      await handleCompleteSession(currentSessionId, sessionStartTime);
    }
    
    // Play sound or notification here
    if (settings.timer.soundNotifications) {
      playCompletionSound();
    }
    
    const newSessionType = sessionType === "focus" ? "break" : "focus";
    const newTimeLeft = newSessionType === "focus" ? 25 * 60 : 5 * 60;
    
    setSessionType(newSessionType);
    setTimeLeft(newTimeLeft);
    setState("idle");
    setCurrentSessionId(null);
    setSessionStartTime(null);
    setTotalElapsed(0);
  };

  const playCompletionSound = () => {
    try {
      // Create audio context for playing sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple completion sound using Web Audio API
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Show browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Productivity Pro", {
          body: sessionType === "focus" 
            ? "Focus session completed! Time for a break." 
            : "Break completed! Ready for another focus session?",
          icon: "/logo.svg"
        });
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  return (
    <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Timer className="w-24 h-24 text-primary" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50">
          {sessionType === "focus" ? (
            <Timer className="w-4 h-4 text-primary" />
          ) : (
            <Coffee className="w-4 h-4 text-orange-500" />
          )}
          <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {sessionType === "focus" ? "Focus Session" : "Short Break"}
          </span>
        </div>

        <div className="text-6xl md:text-7xl font-display font-bold tabular-nums tracking-tight text-foreground">
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-4">
          {state === "running" ? (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-14 h-14 p-0 border-2"
              onClick={handlePause}
            >
              <Pause className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="rounded-full w-14 h-14 p-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all"
              onClick={handleStart}
            >
              <Play className="w-6 h-6 ml-1" />
            </Button>
          )}

          {(state === "running" || state === "paused") && (
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full w-14 h-14 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleStop}
            >
              <Square className="w-5 h-5 fill-current" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
