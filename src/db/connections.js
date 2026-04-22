const mongoose = require('mongoose');

let localConn = null;
let onlineConn = null;

async function connectLocal() {
  if (!localConn) {
    try {
      localConn = await mongoose
        .createConnection(process.env.MONGO_LOCAL)
        .asPromise();
      console.log('✅ MongoDB LOCAL conectado');
    } catch (err) {
      console.error('❌ Erro crítico: Falha ao conectar no LOCAL');
      throw err;
    }
  }
  return localConn;
}

async function connectOnline() {
  // Se já tentou e falhou, ou se já está conectado, retorna o estado atual
  if (onlineConn) return onlineConn;

  try {
    // O timeout curto é essencial para não travar a aplicação offline
    onlineConn = await mongoose
      .createConnection(process.env.MONGO_ONLINE, {
        serverSelectionTimeoutMS: 2000, 
        connectTimeoutMS: 2000,
      })
      .asPromise();

    console.log('☁️ MongoDB ONLINE conectado');
    return onlineConn;
  } catch (err) {
    // Aqui ele captura o erro de DNS (ECONNREFUSED) ou Timeout
    console.log('⚠️ MongoDB ONLINE indisponível (Offline)');
    onlineConn = null; 
    return null;
  }
}

// Função para garantir que o app suba mesmo sem internet
async function connectDatabases() {
  await connectLocal(); // Local é obrigatório para o sistema abrir
  
  // Tentamos o online em "background", sem dar await no carregamento principal
  // ou tratando o erro para não crashar
  try {
    await connectOnline();
  } catch (e) {
    console.log('Sistemas online ignorados por enquanto.');
  }
  
  return { localConn, onlineConn };
}

module.exports = {
  connectLocal,
  connectOnline,
  connectDatabases,
};