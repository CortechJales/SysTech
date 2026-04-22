const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const SyncQueueSchema = require('./SyncQueueModel');

const LoginSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

class Login {
  constructor(body, connection) {
    this.body = body;
    this.errors = [];
    this.user = null;
    this.connection = connection;
    // Instancia o modelo vinculado à conexão fornecida
    this.Model = connection.models.Login || connection.model('Login', LoginSchema);
  }

  async login() {
    this.valida();
    if (this.errors.length) return;

    this.user = await this.Model.findOne({ email: this.body.email });
    if (!this.user) {
      this.errors.push('Usuário não existe');
      return;
    }

    if (!bcrypt.compareSync(this.body.password, this.user.password)) {
      this.errors.push('Senha inválida');
      this.user = null;
    }
  }

  async register() {
    this.valida();
    if (this.errors.length) return;

    const exists = await this.Model.findOne({ email: this.body.email });
    if (exists) {
      this.errors.push('Usuário já existe');
      return;
    }

    const salt = bcrypt.genSaltSync();
    this.body.password = bcrypt.hashSync(this.body.password, salt);

    this.user = await this.Model.create(this.body);

    // 🔥 Registra na fila de sincronização (sempre na conexão local)
    // Importante: SyncQueue também precisa ser instanciado pela conexão
    const SyncQueue = this.connection.models.SyncQueue || this.connection.model('SyncQueue', SyncQueueSchema);
    
    await SyncQueue.create({
      collectionName: 'Login',
      action: 'create',
      payload: this.user.toObject(),
    });
  }

  valida() {
    this.cleanUp();
    if (!validator.isEmail(this.body.email)) this.errors.push('E-mail inválido');
    if (this.body.password.length < 3 || this.body.password.length > 50) {
      this.errors.push('Senha deve ter entre 3 e 50 caracteres');
    }
  }

  cleanUp() {
    for (const key in this.body) {
      if (typeof this.body[key] !== 'string') this.body[key] = '';
    }
  }
}

module.exports = { Login, LoginSchema };