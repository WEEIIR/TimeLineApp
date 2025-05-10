const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveTimeline: (data) => ipcRenderer.invoke('save-timeline', data),
  loadTimeline: () => ipcRenderer.invoke('load-timeline')
});
