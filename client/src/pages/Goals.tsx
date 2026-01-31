import { useState, useEffect } from "react";
import { useGoals, useCreateGoal, useDeleteGoal, useUpdateGoal } from "@/hooks/use-goals-habits";
import { useHabits, useCreateHabit, useDeleteHabit, useHabitLogs, useCreateHabitLog } from "@/hooks/use-goals-habits";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Target, 
  Trash2, 
  Plus, 
  Activity, 
  BookOpen, 
  Briefcase, 
  Heart,
  TrendingUp,
  Calendar,
  Edit,
  CheckCircle,
  ChevronUp,
  Check,
  Flame,
  CalendarDays,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays, addDays, isToday, isYesterday, startOfDay, subDays } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, insertHabitSchema, insertHabitLogSchema } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

function GoalCard({ goal }: { goal: any }) {
  const deleteGoal = useDeleteGoal();
  const updateGoal = useUpdateGoal();
  const [isEditing, setIsEditing] = useState(false);
  const [editProgress, setEditProgress] = useState(goal.currentProgress);
  
  const percentage = Math.min(100, Math.round((goal.currentProgress / goal.targetValue) * 100));
  const isCompleted = goal.currentProgress >= goal.targetValue;
  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
  const isOverdue = daysLeft < 0 && !isCompleted;
  
  const handleProgressUpdate = () => {
    updateGoal.mutate({
      id: goal.id,
      currentProgress: Math.min(editProgress, goal.targetValue),
      completed: editProgress >= goal.targetValue ? 1 : 0
    });
    setIsEditing(false);
  };
  
  const handleQuickIncrement = (amount: number) => {
    const newProgress = Math.min(goal.currentProgress + amount, goal.targetValue);
    updateGoal.mutate({
      id: goal.id,
      currentProgress: newProgress,
      completed: newProgress >= goal.targetValue ? 1 : 0
    });
  };
  
  const getStatusColor = () => {
    if (isCompleted) return 'border-l-green-500';
    if (isOverdue) return 'border-l-red-500';
    if (daysLeft <= 7) return 'border-l-yellow-500';
    return 'border-l-primary';
  };
  
  const getStatusBadge = () => {
    if (isCompleted) return { text: 'Completed', variant: 'default' as const };
    if (isOverdue) return { text: 'Overdue', variant: 'destructive' as const };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, variant: 'secondary' as const };
    return { text: `${daysLeft} days left`, variant: 'outline' as const };
  };
  
  const status = getStatusBadge();

  return (
    <Card className={`hover:shadow-md transition-all duration-300 border-l-4 ${getStatusColor()} relative`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{goal.category}</p>
              <Badge variant={status.variant} className="text-xs">
                {status.text}
              </Badge>
            </div>
            <CardTitle className={`text-lg ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {goal.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteGoal.mutate(goal.id)}>
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{goal.currentProgress} / {goal.targetValue} {goal.unit}</span>
            </div>
            <Progress value={percentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percentage}% Complete</span>
              <span>{Math.round((goal.targetValue - goal.currentProgress) / goal.targetValue * 100)}% Remaining</span>
            </div>
          </div>
          
          {/* Quick Actions */}
          {!isCompleted && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quick add:</span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickIncrement(1)}
                  disabled={goal.currentProgress + 1 > goal.targetValue}
                  title="+1 unit"
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickIncrement(Math.ceil(goal.targetValue * 0.1))}
                  disabled={goal.currentProgress + Math.ceil(goal.targetValue * 0.1) > goal.targetValue}
                  title="+10%"
                >
                  <TrendingUp className="w-3 h-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleQuickIncrement(goal.targetValue - goal.currentProgress)}
                  title="Complete"
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Edit Progress */}
          {isEditing && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Input
                type="number"
                value={editProgress}
                onChange={(e) => setEditProgress(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 h-8"
                min={0}
                max={goal.targetValue}
              />
              <span className="text-sm text-muted-foreground">/ {goal.targetValue} {goal.unit}</span>
              <Button size="sm" onClick={handleProgressUpdate}>
                Update
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setIsEditing(false);
                setEditProgress(goal.currentProgress);
              }}>
                Cancel
              </Button>
            </div>
          )}
          
          {/* Target Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
            {!isCompleted && (
              <span className={`font-medium ${
                isOverdue ? 'text-red-500' : daysLeft <= 7 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                ({isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`})
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HabitCard({ habit }: { habit: any }) {
  const deleteHabit = useDeleteHabit();
  const createHabitLog = useCreateHabitLog();
  const { data: habitLogs } = useHabitLogs();
  const queryClient = useQueryClient();
  
  // Shared completed habits state (same as Dashboard)
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
  
  const icons: any = {
    Health: Activity,
    Learning: BookOpen,
    Productivity: Briefcase,
    Personal: Heart
  };
  const Icon = icons[habit.category] || Target;

  // Check if habit is completed today (from DB or local state)
  const isCompletedFromDB = habitLogs?.some(log => {
    if (!log.completedAt) return false;
    const logDate = new Date(log.completedAt);
    return isToday(logDate) && log.habitId === habit.id;
  }) || false;
  
  const isCompletedToday = isCompletedFromDB || completedHabits.has(habit.id);

  // Calculate real streak from habit logs
  const calculateStreak = () => {
    if (!habitLogs || habitLogs.length === 0) return 0;
    
    const todayLogs = habitLogs
      .filter(log => log.habitId === habit.id)
      .map(log => new Date(log.completedAt))
      .sort((a, b) => b.getTime() - a.getTime());
    
    if (todayLogs.length === 0) return 0;
    
    let streak = 0;
    let currentDate = startOfDay(new Date());
    
    for (const logDate of todayLogs) {
      const logDay = startOfDay(logDate);
      if (isToday(logDay) || isYesterday(logDay) || differenceInDays(currentDate, logDay) === 0) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (differenceInDays(currentDate, logDay) === 1) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const realStreak = calculateStreak();

  const handleCompleteHabit = () => {
    // Check if already logged today or already in completed state
    const alreadyCompleted = completedHabits.has(habit.id);
    
    if (!isCompletedToday && !alreadyCompleted) {
      // Optimistically update local state
      setCompletedHabits(prev => new Set([...prev, habit.id]));
      
      createHabitLog.mutate({
        habitId: habit.id,
        completedAt: new Date().toISOString().split('T')[0]
      }, {
        onError: () => {
          // Rollback on error
          setCompletedHabits(prev => {
            const newSet = new Set(prev);
            newSet.delete(habit.id);
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

  const getStreakColor = () => {
    if (realStreak >= 30) return 'text-purple-600';
    if (realStreak >= 14) return 'text-blue-600';
    if (realStreak >= 7) return 'text-green-600';
    if (realStreak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStreakBadge = () => {
    if (realStreak >= 30) return { text: 'Legendary!', variant: 'default' as const };
    if (realStreak >= 14) return { text: 'On Fire!', variant: 'secondary' as const };
    if (realStreak >= 7) return { text: 'Great!', variant: 'outline' as const };
    if (realStreak >= 3) return { text: 'Good Start', variant: 'outline' as const };
    return { text: 'Keep Going', variant: 'outline' as const };
  };

  const streakBadge = getStreakBadge();

  return (
    <Card className={`hover:shadow-md transition-all duration-300 ${
      isCompletedToday ? 'border-l-4 border-l-green-500 bg-green-50/50' : 'border-l-4 border-l-primary'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{habit.category}</p>
              {realStreak > 0 && (
                <Badge variant={streakBadge.variant} className="text-xs">
                  {streakBadge.text}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{habit.name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => deleteHabit.mutate(habit.id)}>
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Streak Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${getStreakColor()}`} />
              <div>
                <div className={`text-2xl font-bold ${getStreakColor()}`}>{realStreak}</div>
                <div className="text-xs text-muted-foreground">day streak</div>
              </div>
            </div>
            
            {/* Complete Button */}
            <Button 
              onClick={handleCompleteHabit}
              disabled={isCompletedToday}
              className={isCompletedToday ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isCompletedToday ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Completed Today
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Today
                </>
              )}
            </Button>
          </div>

          {/* Progress Visualization */}
          {realStreak > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Weekly Progress</span>
                <span>{Math.min(realStreak, 7)}/7 days</span>
              </div>
              <Progress value={(Math.min(realStreak, 7) / 7) * 100} className="h-2" />
            </div>
          )}

          {/* Motivational Message */}
          {realStreak === 0 && (
            <div className="text-center py-2 px-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Start your streak today! 🔥</p>
            </div>
          )}

          {realStreak > 0 && realStreak < 3 && (
            <div className="text-center py-2 px-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">Great start! Keep it going! 💪</p>
            </div>
          )}

          {realStreak >= 3 && realStreak < 7 && (
            <div className="text-center py-2 px-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">You're building momentum! 🚀</p>
            </div>
          )}

          {realStreak >= 7 && realStreak < 14 && (
            <div className="text-center py-2 px-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Amazing consistency! 🎉</p>
            </div>
          )}

          {realStreak >= 14 && (
            <div className="text-center py-2 px-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">You're a habit master! 🏆</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Goals() {
  const { data: goals } = useGoals();
  const { data: habits } = useHabits();
  const { data: habitLogs } = useHabitLogs();
  
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const createHabit = useCreateHabit();
  
  const [goalOpen, setGoalOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);

  const goalForm = useForm({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: "",
      category: "Productivity",
      targetValue: 100,
      currentProgress: 0,
      unit: "%",
      targetDate: addDays(new Date(), 30).toISOString().split('T')[0]
    }
  });

  const habitForm = useForm({
    resolver: zodResolver(insertHabitSchema),
    defaultValues: {
      name: "",
      category: "Health",
      streak: 0
    }
  });
  
  // Calculate goal statistics
  const goalStats = {
    total: goals?.length || 0,
    completed: goals?.filter(g => g.currentProgress >= g.targetValue).length || 0,
    inProgress: goals?.filter(g => g.currentProgress < g.targetValue && new Date(g.targetDate) >= new Date()).length || 0,
    overdue: goals?.filter(g => g.currentProgress < g.targetValue && new Date(g.targetDate) < new Date()).length || 0
  };
  
  // Calculate habit statistics
  const habitStats = {
    total: habits?.length || 0,
    completedToday: habitLogs?.filter(log => {
      if (!log.completedAt) return false;
      return isToday(new Date(log.completedAt));
    }).length || 0,
    activeStreaks: habits?.filter(habit => {
      const habitLogsForHabit = habitLogs?.filter(log => log.habitId === habit.id) || [];
      return habitLogsForHabit.some(log => isToday(new Date(log.completedAt)));
    }).length || 0,
    longestStreak: habits?.reduce((max, habit) => {
      const habitLogsForHabit = habitLogs?.filter(log => log.habitId === habit.id) || [];
      let streak = 0;
      let currentDate = startOfDay(new Date());
      
      for (const log of habitLogsForHabit
        .map(log => new Date(log.completedAt))
        .sort((a, b) => b.getTime() - a.getTime())) {
        const logDay = startOfDay(log);
        if (differenceInDays(currentDate, logDay) === 0) {
          streak++;
          currentDate = subDays(currentDate, 1);
        } else if (differenceInDays(currentDate, logDay) === 1) {
          streak++;
          currentDate = subDays(currentDate, 1);
        } else {
          break;
        }
      }
      return Math.max(max, streak);
    }, 0) || 0
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Goals & Habits</h1>
        <p className="text-muted-foreground mt-1">Track your long-term progress.</p>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="goals">Long-term Goals</TabsTrigger>
          <TabsTrigger value="habits">Daily Habits</TabsTrigger>
        </TabsList>

        {/* --- GOALS CONTENT --- */}
        <TabsContent value="goals" className="space-y-6 mt-6">
          {/* Goal Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{goalStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{goalStats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{goalStats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{goalStats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </Card>
          </div>
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Active Goals</h2>
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> New Goal</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create New Goal</DialogTitle></DialogHeader>
                <form onSubmit={goalForm.handleSubmit((data: any) => createGoal.mutate(data, { onSuccess: () => setGoalOpen(false) }))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Goal Title</label>
                    <Input {...goalForm.register("title")} placeholder="Read 12 Books" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Value</label>
                      <Input type="number" {...goalForm.register("targetValue", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unit</label>
                      <Input {...goalForm.register("unit")} placeholder="books" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Progress</label>
                      <Input type="number" {...goalForm.register("currentProgress", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Date</label>
                      <Input type="date" {...goalForm.register("targetDate")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select onValueChange={(v) => goalForm.setValue("category", v)} defaultValue="Productivity">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Productivity">Productivity</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Learning">Learning</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createGoal.isPending}>Create Goal</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals?.map(goal => <GoalCard key={goal.id} goal={goal} />)}
            {goals?.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No goals set yet.</p>}
          </div>
        </TabsContent>

        {/* --- HABITS CONTENT --- */}
        <TabsContent value="habits" className="space-y-6 mt-6">
          {/* Habit Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{habitStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Habits</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{habitStats.completedToday}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{habitStats.activeStreaks}</div>
              <div className="text-sm text-muted-foreground">Active Streaks</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">{habitStats.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Longest Streak</div>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Daily Habits</h2>
            <Dialog open={habitOpen} onOpenChange={setHabitOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> New Habit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Habit</DialogTitle></DialogHeader>
                <form onSubmit={habitForm.handleSubmit((data: any) => createHabit.mutate(data, { onSuccess: () => setHabitOpen(false) }))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Habit Name</label>
                    <Input {...habitForm.register("name")} placeholder="Morning Meditation" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select onValueChange={(v) => habitForm.setValue("category", v)} defaultValue="Health">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Productivity">Productivity</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Learning">Learning</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createHabit.isPending}>Add Habit</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {habits?.map(habit => <HabitCard key={habit.id} habit={habit} />)}
            {habits?.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No habits tracked yet. Start building better habits today!</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
