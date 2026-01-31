import { useState, useMemo, useEffect } from "react";
import { useTodos } from "@/hooks/use-todos";
import { useGoals } from "@/hooks/use-goals-habits";
import { useHabits, useHabitLogs } from "@/hooks/use-goals-habits";
import { useWorkSessions } from "@/hooks/use-work-sessions";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  format,
  isSameDay, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isAfter,
  isBefore
} from "date-fns";
import { 
  CheckCircle2, 
  Circle, 
  Target, 
  Activity, 
  Clock, 
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const { data: todos } = useTodos();
  const { data: goals } = useGoals();
  const { data: habits } = useHabits();
  const { data: habitLogs } = useHabitLogs();
  const { data: workSessions } = useWorkSessions();

  // Shared completed habits state (same as Dashboard and Goals)
  const [completedHabits, setCompletedHabits] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('completedHabits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  // Calculate data for selected date
  const selectedDateData = useMemo(() => {
    if (!selectedDate) return { todos: [], goals: [], habits: [], workSessions: [], stats: {} };

    const selectedDateTodos = todos?.filter(todo => 
      todo.date && isSameDay(parseISO(todo.date.toString()), selectedDate)
    ) || [];

    const selectedDateGoals = goals?.filter(goal => {
      const targetDate = new Date(goal.targetDate);
      return isSameDay(targetDate, selectedDate);
    }) || [];

    const selectedDateHabits = habits?.filter(habit => {
      // Check if habit is completed today from database
      const isCompletedFromDB = habitLogs?.some(log => 
        log.habitId === habit.id && 
        isSameDay(parseISO(log.completedAt.toString()), selectedDate)
      );
      
      // Check if habit is completed today from localStorage (only for today)
      const isCompletedFromLocalStorage = isToday(selectedDate) && completedHabits.has(habit.id);
      
      return isCompletedFromDB || isCompletedFromLocalStorage;
    }) || [];

    const selectedDateWorkSessions = workSessions?.filter(session => {
      if (!session.startTime) return false;
      const sessionDate = parseISO(session.startTime.toString());
      return isSameDay(sessionDate, selectedDate);
    }) || [];

    const totalFocusMinutes = selectedDateWorkSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const completedTodos = selectedDateTodos.filter(todo => todo.completed).length;
    const totalTodos = selectedDateTodos.length;
    const completedGoals = selectedDateGoals.filter(goal => goal.currentProgress >= goal.targetValue).length;

    return {
      todos: selectedDateTodos,
      goals: selectedDateGoals,
      habits: selectedDateHabits,
      workSessions: selectedDateWorkSessions,
      stats: {
        totalFocusMinutes,
        completedTodos,
        totalTodos,
        completedGoals,
        focusHours: (totalFocusMinutes / 60).toFixed(1)
      }
    };
  }, [selectedDate, todos, goals, habits, habitLogs, workSessions]);

  // Calculate month overview
  const monthOverview = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const overview = monthDays.map(day => {
      const dayTodos = todos?.filter(todo => 
        todo.date && isSameDay(parseISO(todo.date.toString()), day)
      ) || [];
      
      const dayWorkSessions = workSessions?.filter(session => {
        if (!session.startTime) return false;
        const sessionDate = parseISO(session.startTime.toString());
        return isSameDay(sessionDate, day);
      }) || [];

      const dayHabits = habits?.filter(habit => {
        // Check if habit is completed from database
        const isCompletedFromDB = habitLogs?.some(log => 
          log.habitId === habit.id && 
          isSameDay(parseISO(log.completedAt.toString()), day)
        );
        
        // Check if habit is completed from localStorage (only for today)
        const isCompletedFromLocalStorage = isToday(day) && completedHabits.has(habit.id);
        
        return isCompletedFromDB || isCompletedFromLocalStorage;
      }) || [];

      const completedTodos = dayTodos.filter(todo => todo.completed).length;
      const totalFocusMinutes = dayWorkSessions.reduce((sum, session) => sum + (session.duration || 0), 0);

      return {
        date: day,
        totalTodos: dayTodos.length,
        completedTodos,
        totalHabits: dayHabits.length,
        focusMinutes: totalFocusMinutes,
        hasActivity: dayTodos.length > 0 || dayWorkSessions.length > 0 || dayHabits.length > 0
      };
    });

    const monthStats = {
      totalTodos: overview.reduce((sum, day) => sum + day.totalTodos, 0),
      completedTodos: overview.reduce((sum, day) => sum + day.completedTodos, 0),
      totalHabits: overview.reduce((sum, day) => sum + day.totalHabits, 0),
      totalFocusMinutes: overview.reduce((sum, day) => sum + day.focusMinutes, 0),
      activeDays: overview.filter(day => day.hasActivity).length
    };

    return { overview, monthStats };
  }, [currentMonth, todos, workSessions, habits, habitLogs]);

  // Calendar modifiers
  const modifiers = {
    hasActivity: (day: Date) => monthOverview.overview.some(d => isSameDay(d.date, day) && d.hasActivity),
    today: isToday
  };
  
  const modifiersStyles = {
    hasActivity: { 
      backgroundColor: "hsl(var(--primary) / 0.1)",
      border: "2px solid hsl(var(--primary))",
      fontWeight: "bold"
    },
    today: {
      backgroundColor: "hsl(var(--primary) / 0.2)",
      border: "2px solid hsl(var(--primary))"
    }
  };

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-1">Track your productivity and schedule.</p>
      </div>

      {/* Month Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{monthOverview.monthStats.totalTodos}</div>
          <div className="text-sm text-muted-foreground">Total Tasks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{monthOverview.monthStats.completedTodos}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{monthOverview.monthStats.totalHabits}</div>
          <div className="text-sm text-muted-foreground">Habits Done</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{(monthOverview.monthStats.totalFocusMinutes / 60).toFixed(1)}h</div>
          <div className="text-sm text-muted-foreground">Focus Time</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{monthOverview.monthStats.activeDays}</div>
          <div className="text-sm text-muted-foreground">Active Days</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar */}
        <Card className="lg:col-span-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border mx-auto"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </Card>

        {/* Selected Date Details */}
        <Card className="lg:col-span-4 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {selectedDate ? format(selectedDate, "MMMM do, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedDate && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-primary">{selectedDateData.stats.totalTodos}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{selectedDateData.stats.focusHours}h</div>
                    <div className="text-xs text-muted-foreground">Focus</div>
                  </div>
                </div>

                {/* Tabs for different data types */}
                <Tabs defaultValue="todos" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="todos">Tasks</TabsTrigger>
                    <TabsTrigger value="habits">Habits</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="todos" className="space-y-3">
                    {selectedDateData.todos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No tasks for this day.</p>
                    ) : (
                      selectedDateData.todos.map(todo => (
                        <div key={todo.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                          <div className={`mt-1 w-2 h-2 rounded-full ${todo.completed ? 'bg-emerald-500' : 'bg-primary'}`} />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {todo.title}
                            </p>
                            <Badge variant="outline" className="text-[10px] h-5 mt-1 capitalize">
                              {todo.priority}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="habits" className="space-y-3">
                    {selectedDateData.habits.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No habits completed this day.</p>
                    ) : (
                      selectedDateData.habits.map(habit => (
                        <div key={habit.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{habit.name}</p>
                            <p className="text-xs text-muted-foreground">{habit.category}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-3">
                    {selectedDateData.goals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No goals due this day.</p>
                    ) : (
                      selectedDateData.goals.map(goal => (
                        <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                          <Target className="w-4 h-4 text-purple-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={(goal.currentProgress / goal.targetValue) * 100} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground">
                                {Math.round((goal.currentProgress / goal.targetValue) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
            
            {!selectedDate && (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a date to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
