export interface WindowControls {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getPath: () => Promise<string>;
  };
  api: Record<string, (args?: any) => Promise<any>>;
  windowControls: WindowControls;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
