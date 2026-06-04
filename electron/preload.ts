/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("slideshowForge", {
  isElectron: true as const,

  getPaths: () => ipcRenderer.invoke("app:getPaths"),
  doctor: () => ipcRenderer.invoke("doctor:run"),
  loadWorkspace: () => ipcRenderer.invoke("workspace:load"),
  saveWorkspace: (payload: unknown) => ipcRenderer.invoke("workspace:save", payload),
  scanFolder: (folderPath: string, options: unknown) => ipcRenderer.invoke("folder:scan", folderPath, options),
  pickFolder: () => ipcRenderer.invoke("dialog:pickFolder"),
  pickOutputDirectory: () => ipcRenderer.invoke("dialog:pickOutput"),
  pickMusicFile: () => ipcRenderer.invoke("dialog:pickMusic"),
  exportSlideshow: (payload: unknown) => ipcRenderer.invoke("export:run", payload),
  openPath: (targetPath: string) => ipcRenderer.invoke("shell:openPath", targetPath),
  showItemInFolder: (targetPath: string) => ipcRenderer.invoke("shell:showItemInFolder", targetPath),

  onExportLog: (callback: (message: string) => void) => {
    const handler = (_: unknown, message: string) => callback(message);
    ipcRenderer.on("export:log", handler);
    return () => ipcRenderer.removeListener("export:log", handler);
  },
  onExportProgress: (callback: (percent: number) => void) => {
    const handler = (_: unknown, percent: number) => callback(percent);
    ipcRenderer.on("export:progress", handler);
    return () => ipcRenderer.removeListener("export:progress", handler);
  },
});
