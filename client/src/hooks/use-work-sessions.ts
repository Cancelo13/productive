import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildIpcChannel, type WorkSession } from "@shared/routes";
import { insertWorkSessionSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  interface Window {
    electron: {
      api: Record<string, (args?: any) => Promise<any>>;
    };
  }
}

export function useWorkSessions() {
  const channel = buildIpcChannel(api.workSessions.list.path, api.workSessions.list.method);
  return useQuery<WorkSession[], Error>({
    queryKey: [channel],
    queryFn: async () => {
      return await window.electron.api[channel]();
    },
  });
}

export function useCreateWorkSession() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.workSessions.create.path, api.workSessions.create.method);
  const listChannel = buildIpcChannel(api.workSessions.list.path, api.workSessions.list.method);
  
  return useMutation<WorkSession, Error, z.infer<typeof insertWorkSessionSchema>>({
    mutationFn: async (data) => {
      return await window.electron.api[channel](data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listChannel] });
    },
  });
}

export function useUpdateWorkSession() {
  const queryClient = useQueryClient();
  const channel = buildIpcChannel(api.workSessions.update.path, api.workSessions.update.method);
  const listChannel = buildIpcChannel(api.workSessions.list.path, api.workSessions.list.method);
  
  return useMutation<WorkSession, Error, { id: number } & Partial<z.infer<typeof insertWorkSessionSchema>>>({
    mutationFn: async ({ id, ...updates }) => {
      return await window.electron.api[channel]({ params: { id }, body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [listChannel] });
    },
  });
}
