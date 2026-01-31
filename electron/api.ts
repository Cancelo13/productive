import { ipcMain } from "electron";
import { storage } from "./storage";
import { api, buildIpcChannel } from "../shared/routes";
import { z } from "zod";

export function registerApiHandlers() {
  console.log("=== Registering API handlers ===");
  console.log("Available routes:", Object.keys(api));
  
  // Todos
  const todoListChannel = buildIpcChannel(api.todos.list.path, api.todos.list.method);
  console.log(`Registering handler for: ${todoListChannel}`);
  try {
    ipcMain.handle(todoListChannel, async () => {
      console.log("Get todos IPC handler called");
      try {
        const result = await storage.getTodos();
        console.log(`Returning ${result.length} todos`);
        return result;
      } catch (err) {
        console.error("Get todos error:", err instanceof Error ? err.message : String(err));
        throw err;
      }
    });
  } catch (err) {
    // Already registered, ignore
    console.log(`Handler already registered for ${todoListChannel}`);
  }
  
  try {
    ipcMain.handle(buildIpcChannel(api.todos.create.path, api.todos.create.method), async (event, args) => {
      console.log("Create todo IPC handler called");
      try {
        const input = api.todos.create.input.parse(args);
        console.log("Parsed input:", { title: input.title, priority: input.priority, date: input.date });
        const result = await storage.createTodo(input);
        console.log("Todo created successfully");
        return result;
      } catch (err) {
        console.error("Create todo error:", err instanceof Error ? err.message : String(err));
        if (err instanceof z.ZodError) {
          throw new Error(JSON.stringify({ message: "Validation error", field: err.errors[0].path.join('.') }));
        }
        throw err;
      }
    });
  } catch (err) {
    // Already registered, ignore
  }
  
  try {
    ipcMain.handle(buildIpcChannel(api.todos.update.path, api.todos.update.method), async (event, args) => {
      try {
        const input = api.todos.update.input.parse(args.body);
        return await storage.updateTodo(Number(args.params.id), input);
      } catch (err) {
        if (err instanceof z.ZodError) {
          throw new Error(JSON.stringify({ message: "Validation error", field: err.errors[0].path.join('.') }));
        }
        throw new Error("Todo not found");
      }
    });
  } catch (err) {
    // Already registered, ignore
  }
  
  try {
    ipcMain.handle(buildIpcChannel(api.todos.delete.path, api.todos.delete.method), async (event, args) => {
      await storage.deleteTodo(Number(args.params.id));
      return;
    });
  } catch (err) {
    // Already registered, ignore
  }

  // Work Sessions
  try { ipcMain.handle(buildIpcChannel(api.workSessions.list.path, api.workSessions.list.method), async () => await storage.getWorkSessions()); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.workSessions.create.path, api.workSessions.create.method), async (event, args) => { const input = api.workSessions.create.input.parse(args); return await storage.createWorkSession(input); }); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.workSessions.update.path, api.workSessions.update.method), async (event, args) => { const input = api.workSessions.update.input.parse(args.body); return await storage.updateWorkSession(Number(args.params.id), input); }); } catch (err) {}

  // Goals
  try { ipcMain.handle(buildIpcChannel(api.goals.list.path, api.goals.list.method), async () => await storage.getGoals()); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.goals.create.path, api.goals.create.method), async (event, args) => { const input = api.goals.create.input.parse(args); return await storage.createGoal(input); }); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.goals.update.path, api.goals.update.method), async (event, args) => { const input = api.goals.update.input.parse(args.body); return await storage.updateGoal(Number(args.params.id), input); }); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.goals.delete.path, api.goals.delete.method), async (event, args) => { await storage.deleteGoal(Number(args.params.id)); }); } catch (err) {}

  // Habits
  try { ipcMain.handle(buildIpcChannel(api.habits.list.path, api.habits.list.method), async () => await storage.getHabits()); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.habits.create.path, api.habits.create.method), async (event, args) => { const input = api.habits.create.input.parse(args); return await storage.createHabit(input); }); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.habits.update.path, api.habits.update.method), async (event, args) => { const input = api.habits.update.input.parse(args.body); return await storage.updateHabit(Number(args.params.id), input); }); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.habits.delete.path, api.habits.delete.method), async (event, args) => { await storage.deleteHabit(Number(args.params.id)); }); } catch (err) {}

  // Habit Logs
  try { ipcMain.handle(buildIpcChannel(api.habitLogs.list.path, api.habitLogs.list.method), async () => await storage.getHabitLogs()); } catch (err) {}
  try { ipcMain.handle(buildIpcChannel(api.habitLogs.create.path, api.habitLogs.create.method), async (event, args) => { const input = api.habitLogs.create.input.parse(args); return await storage.createHabitLog(input); }); } catch (err) {}

  seedDatabase();
}

async function seedDatabase() {
  const existingTodos = await storage.getTodos();
  if (existingTodos.length === 0) {
    await storage.createTodo({
      title: "Complete project documentation",
      priority: "high",
      completed: 0,
      date: new Date().toISOString().split('T')[0]
    } as any);
    await storage.createTodo({
      title: "Review pull requests",
      priority: "medium",
      completed: 0,
      date: new Date().toISOString().split('T')[0]
    } as any);
    await storage.createTodo({
      title: "Team sync meeting",
      priority: "medium",
      completed: 1,
      date: new Date().toISOString().split('T')[0]
    } as any);
  }

  const existingHabits = await storage.getHabits();
  if (existingHabits.length === 0) {
    await storage.createHabit({ name: "Drink 2L Water", category: "Health", streak: 5 });
    await storage.createHabit({ name: "Read 30 mins", category: "Learning", streak: 12 });
    await storage.createHabit({ name: "Code for 1 hour", category: "Productivity", streak: 3 });
  }

  const existingGoals = await storage.getGoals();
  if (existingGoals.length === 0) {
    await storage.createGoal({
      title: "Learn Rust",
      category: "Learning",
      targetDate: "2024-12-31",
      targetValue: 100,
      currentProgress: 45,
      unit: "%"
    } as any);
    await storage.createGoal({
      title: "Launch Side Project",
      category: "Productivity",
      targetDate: "2024-06-30",
      targetValue: 10,
      currentProgress: 3,
      unit: "milestones"
    } as any);
  }
}
