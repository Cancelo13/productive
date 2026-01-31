import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, buildIpcChannel, type Todo } from "@shared/routes";
import { insertTodoSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  interface Window {
    electron: {
      api: Record<string, (args?: any) => Promise<any>>;
    };
  }
}

export function useTodos() {
  const channel = buildIpcChannel(api.todos.list.path, api.todos.list.method);
  return useQuery<Todo[], Error>({
    queryKey: [channel],
    queryFn: async () => {
      console.log(`[useTodos] Calling window.electron.api["${channel}"]`);
      try {
        const result = await window.electron.api[channel]();
        console.log(`[useTodos] Got result:`, result);
        return result;
      } catch (error) {
        console.error(`[useTodos] Error:`, error);
        throw error;
      }
    },
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.todos.create.path, api.todos.create.method);
  const listChannel = buildIpcChannel(api.todos.list.path, api.todos.list.method);
  
  return useMutation<Todo, Error, z.infer<typeof insertTodoSchema>>({
    mutationFn: async (data) => {
      return await window.electron.api[channel](data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listChannel] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.todos.update.path, api.todos.update.method);
  const listChannel = buildIpcChannel(api.todos.list.path, api.todos.list.method);
  
  return useMutation<Todo, Error, { id: number } & Partial<z.infer<typeof insertTodoSchema>>>({ 
    mutationFn: async ({ id, ...updates }) => {
      return await window.electron.api[channel]({ params: { id }, body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listChannel] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.todos.delete.path, api.todos.delete.method);
  const listChannel = buildIpcChannel(api.todos.list.path, api.todos.list.method);
  
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await window.electron.api[channel]({ params: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listChannel] });
    },
  });
}
