const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Importação para v6
const flash = require('connect-flash');
const helmet = require('helmet');
const csrf = require('csurf');

// ===== CONFIGURAÇÃO DOTENV =====
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

// ===== CONFIGURAÇÕES EXPRESS (BÁSICAS) =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.set('views', path.resolve(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// ===== INICIALIZAÇÃO DO SERVIDOR =====
async function startServer() {
  try {
    // 1. CONEXÃO LOCAL (Obrigatória)
    localConn = await mongoose.createConnection(process.env.MONGO_LOCAL).asPromise();
    console.log('✅ MongoDB LOCAL conectado');

    // 2. CONEXÃO ONLINE (Não bloqueante / Resiliente a queda de DNS)
    try {
      onlineConn = await mongoose.createConnection(process.env.MONGO_ONLINE, {
        serverSelectionTimeoutMS: 2000, 
        connectTimeoutMS: 2000,
      }).asPromise();
      console.log('☁️ MongoDB ONLINE conectado');
    } catch (err) {
      console.log('⚠️ Modo Offline: Banco ONLINE indisponível (DNS/Internet).');
    }

    // 3. CONFIGURAÇÃO DE SESSÃO (Compatível com connect-mongo v6)
    // Se MongoStore for um objeto com .default, usamos o .default.create
    const storeCreator = MongoStore.create || (MongoStore.default && MongoStore.default.create);
    
    if (!storeCreator) {
        throw new Error('Não foi possível encontrar o método create no MongoStore.');
    }

    app.use(
      session({
        secret: 'systech_secret_key',
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

    // 4. ESCUTAR PORTA
    app.listen(PORT, () => {
      console.log(isElectron 
        ? `🚀 Servidor Electron rodando em http://localhost:${PORT}` 
        : `🚀 Servidor Web rodando em http://localhost:${PORT}`
      );
    });

    // Iniciar Workers de sincronização e reconexão
    startBackgroundWorkers();

  } catch (e) {
    console.error('❌ Erro crítico ao iniciar o servidor:', e);
    process.exit(1);
  }
}

// ===== TRABALHADORES DE FUNDO =====
function startBackgroundWorkers() {
  // Reconexão Online
  setInterval(async () => {
    if (!onlineConn || onlineConn.readyState !== 1) {
      try {
        onlineConn = await mongoose.createConnection(process.env.MONGO_ONLINE, {
          serverSelectionTimeoutMS: 3000,
        }).asPromise();
        console.log('🔄 MongoDB ONLINE reconectado');
      } catch (e) {
        // Silencioso
      }
    }
  }, 20000);

  // Processamento da Fila
  setInterval(async () => {
    if (onlineConn && onlineConn.readyState === 1 && localConn) {
      try {
        await processQueue(localConn, onlineConn);
      } catch (e) {
        console.error('❌ Erro na sincronização:', e.message);
      }
    }
  }, 30000);
}

// Execução
if (!isElectron) {
  startServer();
}

module.exports = {
  startServer,
  getLocalConnection: () => localConn,
  getOnlineConnection: () => onlineConn,
};