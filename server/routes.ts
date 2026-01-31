import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Todos
  app.get(api.todos.list.path, async (req, res) => {
    const todos = await storage.getTodos();
    res.json(todos);
  });
  app.post(api.todos.create.path, async (req, res) => {
    try {
      const input = api.todos.create.input.parse(req.body);
      const todo = await storage.createTodo(input);
      res.status(201).json(todo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: err.errors[0].path.join('.') });
        return;
      }
      throw err;
    }
  });
  app.put(api.todos.update.path, async (req, res) => {
    try {
      const input = api.todos.update.input.parse(req.body);
      const todo = await storage.updateTodo(Number(req.params.id), input);
      res.json(todo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", field: err.errors[0].path.join('.') });
        return;
      }
      res.status(404).json({ message: "Todo not found" });
    }
  });
  app.delete(api.todos.delete.path, async (req, res) => {
    await storage.deleteTodo(Number(req.params.id));
    res.status(204).end();
  });

  // Work Sessions
  app.get(api.workSessions.list.path, async (req, res) => {
    const sessions = await storage.getWorkSessions();
    res.json(sessions);
  });
  app.post(api.workSessions.create.path, async (req, res) => {
    const input = api.workSessions.create.input.parse(req.body);
    const session = await storage.createWorkSession(input);
    res.status(201).json(session);
  });
  app.put(api.workSessions.update.path, async (req, res) => {
    const input = api.workSessions.update.input.parse(req.body);
    const session = await storage.updateWorkSession(Number(req.params.id), input);
    res.json(session);
  });

  // Goals
  app.get(api.goals.list.path, async (req, res) => {
    const goals = await storage.getGoals();
    res.json(goals);
  });
  app.post(api.goals.create.path, async (req, res) => {
    const input = api.goals.create.input.parse(req.body);
    const goal = await storage.createGoal(input);
    res.status(201).json(goal);
  });
  app.put(api.goals.update.path, async (req, res) => {
    const input = api.goals.update.input.parse(req.body);
    const goal = await storage.updateGoal(Number(req.params.id), input);
    res.json(goal);
  });
  app.delete(api.goals.delete.path, async (req, res) => {
    await storage.deleteGoal(Number(req.params.id));
    res.status(204).end();
  });

  // Habits
  app.get(api.habits.list.path, async (req, res) => {
    const habits = await storage.getHabits();
    res.json(habits);
  });
  app.post(api.habits.create.path, async (req, res) => {
    const input = api.habits.create.input.parse(req.body);
    const habit = await storage.createHabit(input);
    res.status(201).json(habit);
  });
  app.put(api.habits.update.path, async (req, res) => {
    const input = api.habits.update.input.parse(req.body);
    const habit = await storage.updateHabit(Number(req.params.id), input);
    res.json(habit);
  });
  app.delete(api.habits.delete.path, async (req, res) => {
    await storage.deleteHabit(Number(req.params.id));
    res.status(204).end();
  });

  // Habit Logs
  app.get(api.habitLogs.list.path, async (req, res) => {
    const logs = await storage.getHabitLogs();
    res.json(logs);
  });
  app.post(api.habitLogs.create.path, async (req, res) => {
    const input = api.habitLogs.create.input.parse(req.body);
    const log = await storage.createHabitLog(input);
    res.status(201).json(log);
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingTodos = await storage.getTodos();
  if (existingTodos.length === 0) {
    await storage.createTodo({
      title: "Complete project documentation",
      priority: "high",
      completed: false,
      date: new Date().toISOString().split('T')[0]
    });
    await storage.createTodo({
      title: "Review pull requests",
      priority: "medium",
      completed: false,
      date: new Date().toISOString().split('T')[0]
    });
    await storage.createTodo({
      title: "Team sync meeting",
      priority: "medium",
      completed: true,
      date: new Date().toISOString().split('T')[0]
    });
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
    });
    await storage.createGoal({
      title: "Launch Side Project",
      category: "Productivity",
      targetDate: "2024-06-30",
      targetValue: 10,
      currentProgress: 3,
      unit: "milestones"
    });
  }
}
