import { db } from "./db";
import { 
  todos, workSessions, goals, habits, habitLogs,
  type Todo, type InsertTodo,
  type WorkSession, type InsertWorkSession,
  type Goal, type InsertGoal,
  type Habit, type InsertHabit,
  type HabitLog, type InsertHabitLog
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Todos
  getTodos(): Promise<Todo[]>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, todo: Partial<InsertTodo>): Promise<Todo>;
  deleteTodo(id: number): Promise<void>;

  // Work Sessions
  getWorkSessions(): Promise<WorkSession[]>;
  createWorkSession(session: InsertWorkSession): Promise<WorkSession>;
  updateWorkSession(id: number, session: Partial<InsertWorkSession>): Promise<WorkSession>;

  // Goals
  getGoals(): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;

  // Habits
  getHabits(): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habit: Partial<InsertHabit>): Promise<Habit>;
  deleteHabit(id: number): Promise<void>;

  // Habit Logs
  getHabitLogs(): Promise<HabitLog[]>;
  createHabitLog(log: InsertHabitLog): Promise<HabitLog>;
}

export class DatabaseStorage implements IStorage {
  // Todos
  async getTodos(): Promise<Todo[]> {
    return await db.select().from(todos).orderBy(desc(todos.id)) as any;
  }
  async createTodo(todo: InsertTodo): Promise<Todo> {
    const result = await db.insert(todos).values(todo as any).returning() as any;
    return result[0];
  }
  async updateTodo(id: number, update: Partial<InsertTodo>): Promise<Todo> {
    const result = await db.update(todos).set(update).where(eq(todos.id, id)).returning() as any;
    return result[0];
  }
  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  // Work Sessions
  async getWorkSessions(): Promise<WorkSession[]> {
    return await db.select().from(workSessions).orderBy(desc(workSessions.startTime)) as any;
  }
  async createWorkSession(session: InsertWorkSession): Promise<WorkSession> {
    const result = await db.insert(workSessions).values(session as any).returning() as any;
    return result[0];
  }
  async updateWorkSession(id: number, update: Partial<InsertWorkSession>): Promise<WorkSession> {
    const result = await db.update(workSessions).set(update).where(eq(workSessions.id, id)).returning() as any;
    return result[0];
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return await db.select().from(goals).orderBy(asc(goals.targetDate)) as any;
  }
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values(goal as any).returning() as any;
    return result[0];
  }
  async updateGoal(id: number, update: Partial<InsertGoal>): Promise<Goal> {
    const result = await db.update(goals).set(update).where(eq(goals.id, id)).returning() as any;
    return result[0];
  }
  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return await db.select().from(habits).orderBy(asc(habits.id)) as any;
  }
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values(habit as any).returning() as any;
    return result[0];
  }
  async updateHabit(id: number, update: Partial<InsertHabit>): Promise<Habit> {
    const result = await db.update(habits).set(update as any).where(eq(habits.id, id)).returning() as any;
    return result[0];
  }
  async deleteHabit(id: number): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  }

  // Habit Logs
  async getHabitLogs(): Promise<HabitLog[]> {
    return await db.select().from(habitLogs).orderBy(desc(habitLogs.completedAt)) as any;
  }
  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    const result = await db.insert(habitLogs).values(log as any).returning() as any;
    return result[0];
  }
}

export const storage = new DatabaseStorage();
