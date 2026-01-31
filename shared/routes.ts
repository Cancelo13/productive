import { z } from 'zod';
import { 
  insertTodoSchema, 
  insertWorkSessionSchema, 
  insertGoalSchema, 
  insertHabitSchema, 
  insertHabitLogSchema,
  todos,
  workSessions,
  goals,
  habits,
  habitLogs
} from './schema';
import type { 
  Todo,
  WorkSession,
  Goal,
  Habit,
  HabitLog,
  InsertTodo,
  InsertWorkSession,
  InsertGoal,
  InsertHabit,
  InsertHabitLog
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  todos: {
    list: {
      method: 'GET' as const,
      path: '/api/todos',
      responses: {
        200: z.array(z.custom<typeof todos.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/todos',
      input: insertTodoSchema,
      responses: {
        201: z.custom<typeof todos.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/todos/:id',
      input: insertTodoSchema.partial(),
      responses: {
        200: z.custom<typeof todos.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/todos/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  workSessions: {
    list: {
      method: 'GET' as const,
      path: '/api/work-sessions',
      responses: {
        200: z.array(z.custom<typeof workSessions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/work-sessions',
      input: insertWorkSessionSchema,
      responses: {
        201: z.custom<typeof workSessions.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/work-sessions/:id',
      input: insertWorkSessionSchema.partial(),
      responses: {
        200: z.custom<typeof workSessions.$inferSelect>(),
      },
    },
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/goals/:id',
      input: insertGoalSchema.partial(),
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  habits: {
    list: {
      method: 'GET' as const,
      path: '/api/habits',
      responses: {
        200: z.array(z.custom<typeof habits.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/habits',
      input: insertHabitSchema,
      responses: {
        201: z.custom<typeof habits.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/habits/:id',
      input: insertHabitSchema.partial(),
      responses: {
        200: z.custom<typeof habits.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/habits/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  habitLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/habit-logs',
      responses: {
        200: z.array(z.custom<typeof habitLogs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/habit-logs',
      input: insertHabitLogSchema,
      responses: {
        201: z.custom<typeof habitLogs.$inferSelect>(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// For IPC, we need method-aware channel names since HTTP methods don't apply
export function buildIpcChannel(path: string, method: string): string {
  return `${method.toUpperCase()} ${path}`;
}

// Re-export types
export type {
  Todo,
  WorkSession,
  Goal,
  Habit,
  HabitLog,
  InsertTodo,
  InsertWorkSession,
  InsertGoal,
  InsertHabit,
  InsertHabitLog
};
