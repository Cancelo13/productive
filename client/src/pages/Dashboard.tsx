import { useState, useEffect } from "react";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from "@/hooks/use-todos";
import { useWorkSessions } from "@/hooks/use-work-sessions";
import { useHabits, useHabitLogs, useCreateHabitLog } from "@/hooks/use-goals-habits";
import { useQueryClient } from "@tanstack/react-query";
import { WorkTimer } from "@/components/WorkTimer";
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Clock, 
  Trash2,
  MoreVertical,
  Flame
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, parseISO, isYesterday, startOfDay, subDays, differenceInDays } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertTodoSchema } from "@shared/schema";
import { z } from "zod";

// --- Components ---

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend && <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>}
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function TodoItem({ todo }: { todo: any }) {
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  };

  return (
    <div className={`group flex items-center justify-between p-3 rounded-xl border mb-2 transition-all ${todo.completed ? 'bg-muted/50 border-transparent opacity-60' : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'}`}>
      <div className="flex items-center gap-3">
        <Checkbox 
          checked={!!todo.completed} 
          onCheckedChange={(checked) => updateTodo.mutate({ id: todo.id, completed: checked ? 1 : 0 })}
          className="rounded-full w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="flex flex-col">
          <span className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {todo.title}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            {format(new Date(todo.date || new Date()), "MMM d, yyyy")}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`capitalize font-normal border ${priorityColors[todo.priority as keyof typeof priorityColors]}`}>
          {todo.priority}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => deleteTodo.mutate(todo.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function CreateTodoDialog() {
  const [open, setOpen] = useState(false);
  const createTodo = useCreateTodo();
  
  const form = useForm<z.infer<typeof insertTodoSchema>>({
    resolver: zodResolver(insertTodoSchema),
    defaultValues: {
      title: "",
      priority: "medium",
      date: format(new Date(), "yyyy-MM-dd"), // Consistent date format
      completed: 0
    }
  });

  const onSubmit = (data: any) => {
    createTodo.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Title</label>
            <Input {...form.register("title")} placeholder="e.g. Finish quarterly report" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select 
              defaultValue="medium" 
              onValueChange={(val) => form.setValue("priority", val as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={createTodo.isPending}>
            {createTodo.isPending ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { data: todos } = useTodos();
  const { data: workSessions } = useWorkSessions();
  const { data: habits } = useHabits();
  const { data: habitLogs } = useHabitLogs();
  const createHabitLog = useCreateHabitLog();
  const queryClient = useQueryClient();
  
  // Track completed habits for today to prevent multiple clicks
  const [completedHabits, setCompletedHabits] = useState<Set<number>>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('completedHabits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep habits from today
        const today = format(new Date(), 'yyyy-MM-dd');
        if (parsed.date === today) {
          return new Set(parsed.habits);
        }
      } catch (error) {
        console.error('Error parsing completed habits:', error);
      }
    }
    return new Set();
  });

  // Save completed habits to localStorage whenever they change
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem('completedHabits', JSON.stringify({
      date: today,
      habits: Array.from(completedHabits)
    }));
  }, [completedHabits]);

  const todayTodos = todos?.filter(t => t.date && isToday(parseISO(t.date.toString()))) || [];
  const completedToday = todayTodos.filter(t => !!t.completed).length;
  
  // Calculate real focus hours today
  const todayWorkSessions = workSessions?.filter(session => {
    if (!session.startTime) return false;
    const sessionDate = parseISO(session.startTime.toString());
    return isToday(sessionDate) && session.duration && session.duration > 0;
  }) || [];
  
  const totalFocusMinutesToday = todayWorkSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
  const focusHoursToday = (totalFocusMinutesToday / 60).toFixed(1);
  
  // Calculate yesterday's focus hours for trend
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const yesterdayWorkSessions = workSessions?.filter(session => {
    if (!session.startTime) return false;
    const sessionDate = parseISO(session.startTime.toString());
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === yesterday.getTime() && session.duration && session.duration > 0;
  }) || [];
  
  const totalFocusMinutesYesterday = yesterdayWorkSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
  const focusHoursYesterday = (totalFocusMinutesYesterday / 60).toFixed(1);
  
  // Calculate focus trend
  const focusTrend = totalFocusMinutesYesterday > 0 
    ? `+${((totalFocusMinutesToday - totalFocusMinutesYesterday) / totalFocusMinutesYesterday * 100).toFixed(0)}% from yesterday`
    : totalFocusMinutesToday > 0 ? 'First session today!' : 'No sessions yet';
  
  // Calculate real habit streak (max streak across all habits using same logic as Goals page)
  const calculateHabitStreak = () => {
    if (!habits?.length || !habitLogs?.length) return 0;
    
    let maxStreak = 0;
    
    habits.forEach(habit => {
      const habitLogsForHabit = habitLogs
        .filter(log => log.habitId === habit.id)
        .map(log => new Date(log.completedAt))
        .sort((a, b) => b.getTime() - a.getTime());
      
      if (habitLogsForHabit.length === 0) return;
      
      let currentStreak = 0;
      let currentDate = startOfDay(new Date());
      
      for (const logDate of habitLogsForHabit) {
        const logDay = startOfDay(logDate);
        if (isToday(logDay) || isYesterday(logDay) || differenceInDays(currentDate, logDay) === 0) {
          currentStreak++;
          currentDate = subDays(currentDate, 1);
        } else if (differenceInDays(currentDate, logDay) === 1) {
          currentStreak++;
          currentDate = subDays(currentDate, 1);
        } else {
          break;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    });
    
    return maxStreak;
  };
  
  // Calculate real streak for a specific habit
  const calculateHabitStreakForHabit = (habitId: number) => {
    if (!habitLogs?.length) return 0;
    
    const habitLogsForHabit = habitLogs
      .filter(log => log.habitId === habitId)
      .map(log => new Date(log.completedAt))
      .sort((a, b) => b.getTime() - a.getTime());
    
    if (habitLogsForHabit.length === 0) return 0;
    
    let currentStreak = 0;
    let currentDate = startOfDay(new Date());
    
    for (const logDate of habitLogsForHabit) {
      const logDay = startOfDay(logDate);
      if (isToday(logDay) || isYesterday(logDay) || differenceInDays(currentDate, logDay) === 0) {
        currentStreak++;
        currentDate = subDays(currentDate, 1);
      } else if (differenceInDays(currentDate, logDay) === 1) {
        currentStreak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    return currentStreak;
  };
  
  const habitStreak = calculateHabitStreak();
  const habitStreakText = habitStreak === 1 ? '1 day' : `${habitStreak} days`;
  const habitTrend = habitStreak >= 7 ? 'On fire! 🔥' : habitStreak >= 3 ? 'Keep it up!' : 'Start your streak';
  
  const handleToggleHabit = (habitId: number) => {
    // Check if already logged today or already in completed state
    const loggedToday = habitLogs?.some(
      log => log.habitId === habitId && isToday(new Date(log.completedAt))
    );
    
    const alreadyCompleted = completedHabits.has(habitId);
    
    // Only allow check-in if not already completed today and not already completed locally
    if (!loggedToday && !alreadyCompleted) {
      // Optimistically update local state
      setCompletedHabits(prev => new Set([...prev, habitId]));
      
      createHabitLog.mutate({
        habitId,
        completedAt: new Date().toISOString().split('T')[0]
      }, {
        onError: () => {
          // Rollback on error
          setCompletedHabits(prev => {
            const newSet = new Set(prev);
            newSet.delete(habitId);
            return newSet;
          });
        },
        onSuccess: () => {
          // Invalidate habit logs to refresh data
          queryClient.invalidateQueries({ queryKey: ["GET /api/habit-logs"] });
        }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Good Morning, Creator</h1>
          <p className="text-muted-foreground mt-1">Let's make today productive.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium">{format(new Date(), "EEEE, MMMM do")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tasks Completed" 
          value={`${completedToday}/${todayTodos.length}`} 
          icon={CheckCircle2} 
          trend={todayTodos.length > 0 ? `${Math.round((completedToday / todayTodos.length) * 100)}% completion rate` : 'No tasks today'}
        />
        <StatCard 
          title="Focus Hours" 
          value={`${focusHoursToday}h`} 
          icon={Clock} 
          trend={focusTrend}
        />
        <StatCard 
          title="Habit Streak" 
          value={habitStreakText} 
          icon={Flame} 
          trend={habitTrend}
        />
        <WorkTimer />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Task List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Today's Tasks</h2>
            <CreateTodoDialog />
          </div>
          
          <Card className="h-[500px] flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {!todos ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  Loading tasks...
                </div>
              ) : todayTodos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">No tasks for today</h3>
                    <p className="text-muted-foreground">Enjoy your free time or add a new task!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {todayTodos.map(todo => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Daily Habits Side Panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-display">Daily Habits</h2>
          <Card>
            <CardContent className="p-0">
              {habits?.map((habit, i) => {
                const isCompletedFromDB = habitLogs?.some(
                  log => log.habitId === habit.id && isToday(new Date(log.completedAt))
                );
                const isCompleted = isCompletedFromDB || completedHabits.has(habit.id);

                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-4 border-b last:border-0 transition-colors ${isCompleted ? 'bg-primary/5 cursor-not-allowed opacity-75' : 'hover:bg-muted/50 cursor-pointer'}`}
                    onClick={() => !isCompleted && handleToggleHabit(habit.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'}`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`font-medium ${isCompleted ? 'text-primary' : 'text-foreground'}`}>{habit.name}</p>
                        <p className="text-xs text-muted-foreground">{habit.category}</p>
                        {isCompleted && <p className="text-xs text-primary font-medium">Completed today ✓</p>}
                      </div>
                    </div>
                    <div className="flex items-center text-orange-500 font-medium text-sm gap-1">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {calculateHabitStreakForHabit(habit.id)}
                    </div>
                  </div>
                );
              })}
              
              {(!habits || habits.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">
                  No habits tracked yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
