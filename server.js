const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const helmet = require('helmet');
const csrf = require('csurf');

// ===== CONFIGURAÇÃO DOTENV =====
// Garante que o .env seja lido tanto em dev quanto no executável do Electron
if (process.versions.electron) {
  const envPath = path.join(process.resourcesPath, '.env');
  require('dotenv').config({ path: fs.existsSync(envPath) ? envPath : undefined });
} else {
  require('dotenv').config();
}

const { processQueue } = require('./src/services/syncService');
const routes = require('./routes');
const {
  middlewareGlobal,
  checkCsrfError,
  csrfMiddleware,
} = require('./src/middlewares/middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const isElectron = !!process.versions.electron;

// Variáveis de conexão globais
let localConn = null;
let onlineConn = null;

// ===== CONFIGURAÇÕES EXPRESS =====
app.use(helmet({ 
  contentSecurityPolicy: false, // Necessário para carregar scripts como Chart.js via CDN
  crossOriginEmbedderPolicy: false 
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.set('views', path.resolve(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// ===== INICIALIZAÇÃO DO SERVIDOR =====
async function startServer() {
  try {
    // 1. CONEXÃO LOCAL (Obrigatória para o sistema abrir)
    localConn = await mongoose.createConnection(process.env.MONGO_LOCAL).asPromise();
    console.log('✅ MongoDB LOCAL conectado');

    // 2. CONEXÃO ONLINE (Resiliente)
    try {
      onlineConn = await mongoose.createConnection(process.env.MONGO_ONLINE, {
        serverSelectionTimeoutMS: 2000, 
        connectTimeoutMS: 2000,
      }).asPromise();
      console.log('☁️ MongoDB ONLINE conectado');
    } catch (err) {
      console.log('⚠️ Modo Offline: Banco ONLINE indisponível.');
    }

    // 3. CONFIGURAÇÃO DE SESSÃO
    const storeCreator = MongoStore.create || (MongoStore.default && MongoStore.default.create);
    
    if (!storeCreator) {
        throw new Error('Não foi possível carregar o MongoStore.');
    }

    app.use(
      session({
        secret: 'systech_secret_key_secure',
        store: storeCreator({ 
            mongoUrl: process.env.MONGO_LOCAL,
            ttl: 14 * 24 * 60 * 60 // 14 dias
        }),
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 7,
          httpOnly: true,
        },
      })
    );

    app.use(flash());
    app.use(csrf());

    // Middlewares globais
    app.use(middlewareGlobal);
    app.use(checkCsrfError);
    app.use(csrfMiddleware);

    // Rotas
    app.use(routes);

    // 4. ESCUTAR PORTA (Retornando Promise para sincronia com Electron)
    return new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        console.log(isElectron 
          ? `🚀 Servidor Electron ativo em http://localhost:${PORT}` 
          : `🚀 Servidor Web ativo em http://localhost:${PORT}`
        );
        
        // Iniciar Workers após o servidor subir
        startBackgroundWorkers();
        resolve(server);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Porta ${PORT} já está em uso.`);
          reject(new Error(`A porta ${PORT} já está ocupada por outro programa.`));
        } else {
          reject(err);
        }
      });
    });

  } catch (e) {
    console.error('❌ Erro crítico no server.js:', e.message);
    throw e; // Lança para o main.js capturar no dialog.showErrorBox
  }
}

// ===== TRABALHADORES DE FUNDO (Workers) =====
function startBackgroundWorkers() {
  // Reconexão Online Automática
  setInterval(async () => {
    if (!onlineConn || onlineConn.readyState !== 1) {
      try {
        onlineConn = await mongoose.createConnection(process.env.MONGO_ONLINE, {
          serverSelectionTimeoutMS: 3000,
        }).asPromise();
        console.log('🔄 MongoDB ONLINE reconectado');
      } catch (e) {
        // Silencioso: continua tentando em background
      }
    }
  }, 30000); // 30 segundos

  // Sincronização Local -> Online
  setInterval(async () => {
    if (onlineConn && onlineConn.readyState === 1 && localConn) {
      try {
        await processQueue(localConn, onlineConn);
      } catch (e) {
        console.error('❌ Erro na sincronização automática:', e.message);
      }
    }
  }, 60000); // 1 minuto
}

// Execução automática apenas se NÃO for Electron (modo Web via nodemon)
if (!isElectron) {
  startServer().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

// Exports para o main.js do Electron
module.exports = {
  startServer,
  getLocalConnection: () => localConn,
  getOnlineConnection: () => onlineConn,
};