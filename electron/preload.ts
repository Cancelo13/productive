import { contextBridge, ipcRenderer } from "electron";
import { api, buildUrl, buildIpcChannel } from "../shared/routes";

const ipcApi: Record<string, (args?: any) => Promise<any>> = {};

// For each resource (todos, goals, etc), for each endpoint (list, create, update, delete)
// we need to create a mapping that uses the method to distinguish between endpoints
// with the same path.

// Build a map of path+method -> endpoint for easy lookup
const endpointMap = new Map<string, any>();

Object.values(api).forEach((resource) => {
  Object.values(resource).forEach((endpoint: any) => {
    const key = buildIpcChannel(endpoint.path, endpoint.method);
    endpointMap.set(key, endpoint);
  });
});

// Now register API functions keyed by their path, but smart enough to know which method
Object.values(api).forEach((resource) => {
  Object.values(resource).forEach((endpoint: any) => {
    const path = endpoint.path;
    const method = endpoint.method;
    const channel = buildIpcChannel(path, method);
    
    // Only register once per path+method combo
    if (!ipcApi[channel]) {
      ipcApi[channel] = async (args) => {
        return await ipcRenderer.invoke(channel, args);
      }
    }
  });
});

contextBridge.exposeInMainWorld("electron", {
  app: {
    getVersion: () => ipcRenderer.invoke("get-app-version"),
    getPath: () => ipcRenderer.invoke("get-app-path"),
  },
  api: ipcApi,
  windowControls: {
    minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
    closeWindow: () => ipcRenderer.invoke("window-close"),
  },
});
