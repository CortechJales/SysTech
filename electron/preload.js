const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  imprimirPDF: () => {
    // chama função do main depois
  }
});