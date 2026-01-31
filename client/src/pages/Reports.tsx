import { useWorkSessions } from "@/hooks/use-work-sessions";
import { useTodos } from "@/hooks/use-todos";
import { useGoals } from "@/hooks/use-goals-habits";
import { useHabits } from "@/hooks/use-goals-habits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO, subDays, startOfDay, endOfDay } from "date-fns";

export default function Reports() {
  const { data: sessions } = useWorkSessions();
  const { data: todos } = useTodos();
  const { data: goals } = useGoals();
  const { data: habits } = useHabits();

  // --- DATA PROCESSING FOR CHARTS ---

  // 1. Weekly Activity (Bar Chart) - Focus hours from actual sessions
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const weeklyData = days.map(day => {
    const daySessions = sessions?.filter(s => {
      if (!s.startTime) return false;
      const sessionDate = parseISO(s.startTime.toString());
      return isSameDay(sessionDate, day) && s.duration && s.duration > 0;
    }) || [];
    
    // Calculate actual hours from real session durations
    const totalMinutes = daySessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const hours = totalMinutes / 60;
    
    return {
      day: format(day, "EEE"),
      hours: Math.round(hours * 10) / 10 // Round to 1 decimal place
    };
  });

  // 2. Task Priorities (Pie Chart) - Data from todos
  const priorityData = [
    { name: 'High', value: todos?.filter(t => t.priority === 'high').length || 0, color: '#ef4444' },
    { name: 'Medium', value: todos?.filter(t => t.priority === 'medium').length || 0, color: '#f59e0b' },
    { name: 'Low', value: todos?.filter(t => t.priority === 'low').length || 0, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // 3. Task Completion Trends (Line Chart) - Data from last 7 days
  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const completedTodos = todos?.filter(todo => {
        if (!todo.date || !todo.completed) return false;
        const todoDate = parseISO(todo.date.toString());
        return isSameDay(todoDate, date) && !!todo.completed;
      }) || [];
      
      data.push({
        day: format(date, "EEE"),
        completed: completedTodos.length,
        date: format(date, "MMM dd")
      });
    }
    return data;
  };
  
  const completionData = getLast7DaysData();

  // 4. Calculate Real Statistics
  const stats = {
    totalFocusTime: sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0,
    totalSessions: sessions?.length || 0,
    completedTodos: todos?.filter(t => !!t.completed).length || 0,
    totalTodos: todos?.length || 0,
    completedGoals: goals?.filter(g => g.currentProgress >= g.targetValue).length || 0,
    totalGoals: goals?.length || 0,
    activeHabits: habits?.length || 0,
    avgSessionDuration: sessions?.length ? Math.round((sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length) * 10) / 10 : 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Real insights into your productivity.</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{Math.round(stats.totalFocusTime / 60 * 10) / 10}h</div>
          <div className="text-sm text-muted-foreground">Total Focus Time</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completedTodos}/{stats.totalTodos}</div>
          <div className="text-sm text-muted-foreground">Tasks Completed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.completedGoals}/{stats.totalGoals}</div>
          <div className="text-sm text-muted-foreground">Goals Achieved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.avgSessionDuration}m</div>
          <div className="text-sm text-muted-foreground">Avg Session</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly Focus Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Focus Hours</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} hours`, 'Focus Time']} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, `${name} Priority`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task Completion Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [`${value} tasks`, 'Completed']}
                  labelFormatter={(label) => {
                    const dataPoint = completionData.find(d => d.day === label);
                    return dataPoint?.date || label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3} 
                  dot={{ r: 6 }} 
                  name="Completed Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
