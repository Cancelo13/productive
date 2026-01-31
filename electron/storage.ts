import { db } from "./db";
import { 
  todos, workSessions, goals, habits, habitLogs,
  type Todo, type InsertTodo,
  type WorkSession, type InsertWorkSession,
  type Goal, type InsertGoal,
  type Habit, type InsertHabit,
  type HabitLog, type InsertHabitLog
} from "../shared/schema";
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
    return await db.select().from(todos).orderBy(desc(todos.id));
  }
  async createTodo(todo: InsertTodo): Promise<Todo> {
    const [newTodo] = await db.insert(todos).values(todo).returning();
    return newTodo;
  }
  async updateTodo(id: number, update: Partial<InsertTodo>): Promise<Todo> {
    const [updated] = await db.update(todos).set(update).where(eq(todos.id, id)).returning();
    return updated;
  }
  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  // Work Sessions
  async getWorkSessions(): Promise<WorkSession[]> {
    return await db.select().from(workSessions).orderBy(desc(workSessions.startTime));
  }
  async createWorkSession(session: InsertWorkSession): Promise<WorkSession> {
    const [newSession] = await db.insert(workSessions).values(session).returning();
    return newSession;
  }
  async updateWorkSession(id: number, update: Partial<InsertWorkSession>): Promise<WorkSession> {
    const [updated] = await db.update(workSessions).set(update).where(eq(workSessions.id, id)).returning();
    return updated;
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return await db.select().from(goals).orderBy(asc(goals.targetDate));
  }
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }
  async updateGoal(id: number, update: Partial<InsertGoal>): Promise<Goal> {
    const [updated] = await db.update(goals).set(update).where(eq(goals.id, id)).returning();
    return updated;
  }
  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return await db.select().from(habits).orderBy(asc(habits.id));
  }
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    return newHabit;
  }
  async updateHabit(id: number, update: Partial<InsertHabit>): Promise<Habit> {
    const [updated] = await db.update(habits).set(update).where(eq(habits.id, id)).returning();
    return updated;
  }
  async deleteHabit(id: number): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  }

  // Habit Logs
  async getHabitLogs(): Promise<HabitLog[]> {
    return await db.select().from(habitLogs).orderBy(desc(habitLogs.completedAt));
  }
  async createHabitLog(log: InsertHabitLog): Promise<HabitLog> {
    const [newLog] = await db.insert(habitLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
