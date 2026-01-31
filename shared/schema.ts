import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { sqliteTable, integer as sqliteInteger, text as sqliteText } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Safe environment detection - check if process is defined before accessing env
function isPostgres(): boolean {
  if (typeof process === "undefined") {
    // Client-side: default to false (client doesn't need this check)
    return false;
  }
  return process.env.DATABASE_URL ? process.env.DATABASE_URL.startsWith("postgres") : false;
}

const useSqlite = typeof process === "undefined" || !isPostgres();

// Detect if running in SQLite mode

// ==================== TODOS ====================
const todosPostgres = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium").notNull(),
  date: date("date").defaultNow(),
});

const todosSqlite = sqliteTable("todos", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  title: sqliteText("title").notNull(),
  completed: sqliteInteger("completed").default(0).notNull(),
  priority: sqliteText("priority").default("medium").notNull(),
  date: sqliteText("date"),
});

export const todos = useSqlite ? todosSqlite : todosPostgres;

// ==================== WORK SESSIONS ====================
const workSessionsPostgres = pgTable("work_sessions", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
});

const workSessionsSqlite = sqliteTable("work_sessions", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  startTime: sqliteText("start_time").notNull(),
  endTime: sqliteText("end_time"),
  duration: sqliteInteger("duration"),
});

export const workSessions = useSqlite ? workSessionsSqlite : workSessionsPostgres;

// ==================== GOALS ====================
const goalsPostgres = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  targetDate: date("target_date").notNull(),
  currentProgress: integer("current_progress").default(0).notNull(),
  targetValue: integer("target_value").default(100).notNull(),
  unit: text("unit").default("%").notNull(),
  completed: boolean("completed").default(false).notNull(),
});

const goalsSqlite = sqliteTable("goals", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  title: sqliteText("title").notNull(),
  category: sqliteText("category").notNull(),
  targetDate: sqliteText("target_date").notNull(),
  currentProgress: sqliteInteger("current_progress").default(0).notNull(),
  targetValue: sqliteInteger("target_value").default(100).notNull(),
  unit: sqliteText("unit").default("%").notNull(),
  completed: sqliteInteger("completed").default(0).notNull(),
});

export const goals = useSqlite ? goalsSqlite : goalsPostgres;

// ==================== HABITS ====================
const habitsPostgres = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  streak: integer("streak").default(0).notNull(),
});

const habitsSqlite = sqliteTable("habits", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  name: sqliteText("name").notNull(),
  category: sqliteText("category").notNull(),
  streak: sqliteInteger("streak").default(0).notNull(),
});

export const habits = useSqlite ? habitsSqlite : habitsPostgres;

// ==================== HABIT LOGS ====================
const habitLogsPostgres = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  completedAt: date("completed_at").defaultNow().notNull(),
});

const habitLogsSqlite = sqliteTable("habit_logs", {
  id: sqliteInteger("id").primaryKey({ autoIncrement: true }),
  habitId: sqliteInteger("habit_id").notNull(),
  completedAt: sqliteText("completed_at").notNull(),
});

export const habitLogs = useSqlite ? habitLogsSqlite : habitLogsPostgres;

// Zod Schemas
// @ts-ignore - drizzle-zod type mismatch
const _rawInsertTodo = createInsertSchema(todos).omit({ id: true }) as any as z.AnyZodObject;
// Ensure `completed` accepts boolean (client) or number (sqlite 0/1) and normalize to number
export const insertTodoSchema = (_rawInsertTodo as any).extend({
  completed: z.union([z.boolean(), z.number()]).transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v as number)),
}) as any as z.AnyZodObject;
// @ts-ignore - drizzle-zod type mismatch
export const insertWorkSessionSchema = createInsertSchema(workSessions).omit({ id: true }) as any as z.AnyZodObject;
// @ts-ignore - drizzle-zod type mismatch
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true }) as any as z.AnyZodObject;
// @ts-ignore - drizzle-zod type mismatch
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true }) as any as z.AnyZodObject;
// @ts-ignore - drizzle-zod type mismatch
export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true }) as any as z.AnyZodObject;

// Types
export type Todo = typeof todos.$inferSelect;
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type WorkSession = typeof workSessions.$inferSelect;
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;