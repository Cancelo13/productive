import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, buildIpcChannel, type Goal, type Habit, type HabitLog } from "@shared/routes";
import { insertGoalSchema, insertHabitSchema, insertHabitLogSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  interface Window {
    electron: {
      api: Record<string, (args?: any) => Promise<any>>;
    };
  }
}

// --- GOALS ---
export function useGoals() {
  const channel = buildIpcChannel(api.goals.list.path, api.goals.list.method);
  return useQuery<Goal[], Error>({
    queryKey: [channel],
    queryFn: async () => {
      return await window.electron.api[channel]();
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.goals.create.path, api.goals.create.method);
  const listChannel = buildIpcChannel(api.goals.list.path, api.goals.list.method);
  
  return useMutation<Goal, Error, z.infer<typeof insertGoalSchema>>({
    mutationFn: async (data) => {
      return await window.electron.api[channel](data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listChannel] }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.goals.update.path, api.goals.update.method);
  const listChannel = buildIpcChannel(api.goals.list.path, api.goals.list.method);
  
  return useMutation<Goal, Error, { id: number } & Partial<z.infer<typeof insertGoalSchema>>>({
    mutationFn: async ({ id, ...updates }) => {
      return await window.electron.api[channel]({ params: { id }, body: updates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listChannel] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.goals.delete.path, api.goals.delete.method);
  const listChannel = buildIpcChannel(api.goals.list.path, api.goals.list.method);
  
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await window.electron.api[channel]({ params: { id } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listChannel] }),
  });
}

// --- HABITS ---
export function useHabits() {
  const channel = buildIpcChannel(api.habits.list.path, api.habits.list.method);
  return useQuery<Habit[], Error>({
    queryKey: [channel],
    queryFn: async () => {
      return await window.electron.api[channel]();
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.habits.create.path, api.habits.create.method);
  const listChannel = buildIpcChannel(api.habits.list.path, api.habits.list.method);
  
  return useMutation<Habit, Error, z.infer<typeof insertHabitSchema>>({
    mutationFn: async (data) => {
      return await window.electron.api[channel](data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listChannel] }),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.habits.delete.path, api.habits.delete.method);
  const listChannel = buildIpcChannel(api.habits.list.path, api.habits.list.method);
  
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await window.electron.api[channel]({ params: { id } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [listChannel] }),
  });
}

// --- HABIT LOGS ---
export function useHabitLogs() {
  const channel = buildIpcChannel(api.habitLogs.list.path, api.habitLogs.list.method);
  return useQuery<HabitLog[], Error>({
    queryKey: [channel],
    queryFn: async () => {
      return await window.electron.api[channel]();
    },
  });
}

export function useCreateHabitLog() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.habitLogs.create.path, api.habitLogs.create.method);
  const logListChannel = buildIpcChannel(api.habitLogs.list.path, api.habitLogs.list.method);
  const habitsListChannel = buildIpcChannel(api.habits.list.path, api.habits.list.method);
  
  return useMutation<HabitLog, Error, z.infer<typeof insertHabitLogSchema>>({
    mutationFn: async (data) => {
      return await window.electron.api[channel](data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [logListChannel] });
      queryClient.invalidateQueries({ queryKey: [habitsListChannel] }); // Update streaks
    },
  });
}
