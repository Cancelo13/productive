import { Minus, Square, X } from "lucide-react";
import type { ElectronAPI, WindowControls } from "@/types/electron";

export function WindowControls() {
  const minimizeWindow = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.minimizeWindow();
    }
  };

  const maximizeWindow = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.maximizeWindow();
    }
  };

  const closeWindow = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.closeWindow();
    }
  };

  // Only show in Electron environment
  if (!window.electron?.windowControls) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 drag-region-none">
      <button
        onClick={minimizeWindow}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Minimize"
      >
        <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={maximizeWindow}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Maximize"
      >
        <Square className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={closeWindow}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors"
        title="Close"
      >
        <X className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-white" />
      </button>
    </div>
  );
}
