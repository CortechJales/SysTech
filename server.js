const path = require('path');
const fs = require('fs');

// ===== DOTENV =====
if (process.versions.electron) {
  const envPath = path.join(process.resourcesPath, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config();
  }
} else {
  require('dotenv').config();
}

// ===== DEPENDÊNCIAS =====
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const helmet = require('helmet');
const csrf = require('csurf');

const routes = require('./routes');
const {
  middlewareGlobal,
  checkCsrfError,
  csrfMiddleware,
} = require('./src/middlewares/middleware');

const app = express();
const PORT = 3000;
const isElectron = !!process.versions.electron;

// ===== MIDDLEWARES =====
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.set('views', path.resolve(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// ===== SESSION (SEMPRE MONGO) =====
app.use(
  session({
    secret: 'systech_secret',
    store: MongoStore.create({
      mongoUrl: process.env.CONNECTIONSTRING,
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

// ===== CSRF =====
app.use(csrf());
app.use(middlewareGlobal);
app.use(checkCsrfError);
app.use(csrfMiddleware);

// ===== ROTAS =====
app.use(routes);

// ===== START SERVER =====
async function startServer() {
  if (!process.env.CONNECTIONSTRING) {
    throw new Error('CONNECTIONSTRING não encontrada no .env');
  }

  // evita múltiplas conexões
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.CONNECTIONSTRING);
    console.log('MongoDB conectado');
  }

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(
        isElectron
          ? `Servidor Electron rodando em http://localhost:${PORT}`
          : `Servidor Web rodando em http://localhost:${PORT}`
      );
      resolve();
    });
  });
}

// 👉 SE FOR WEB, INICIA AUTOMATICAMENTE
if (!isElectron) {
  startServer().catch((err) => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  });
}

// 👉 Electron importa isso
module.exports = { startServer };