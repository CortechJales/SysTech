const mongoose = require('mongoose');
const SyncQueueSchema = require('./SyncQueueModel');

const MarcaSchema = new mongoose.Schema({
  descricao: { type: String, required: true },
  criadoEm: { type: Date, default: Date.now },
});

class Marca {
  constructor(body, connection) {
    this.body = body;
    this.errors = [];
    this.marca = null;
    this.connection = connection;
    this.Model = connection.models.Marca || connection.model('Marca', MarcaSchema);
  }

  async register() {
    this.valida();
    if (this.errors.length > 0) return;

    this.marca = await this.Model.create(this.body);
    await this.addToQueue('create', this.marca.toObject());
  }

  async edit(id) {
    if (typeof id !== 'string') return;
    this.valida();
    if (this.errors.length > 0) return;

    this.marca = await this.Model.findByIdAndUpdate(id, this.body, { new: true });
    await this.addToQueue('update', { _id: id, ...this.body });
  }

  async addToQueue(action, payload) {
    const SyncQueue = this.connection.models.SyncQueue || this.connection.model('SyncQueue', SyncQueueSchema);
    await SyncQueue.create({
      collectionName: 'Marca',
      action: action,
      payload: payload,
    });
  }

  valida() {
    this.cleanUp();
    if (!this.body.descricao) this.errors.push('O nome da marca é obrigatório.');
  }

  cleanUp() {
    for (const key in this.body) {
      if (typeof this.body[key] !== 'string') this.body[key] = '';
    }
    this.body = { descricao: this.body.descricao };
  }

  // Métodos estáticos adaptados
  static async buscaPorID(id, connection) {
    if (typeof id !== 'string') return null;
    const Model = connection.models.Marca || connection.model('Marca', MarcaSchema);
    return await Model.findById(id);
  }

  static async buscaMarcas(connection) {
    const Model = connection.models.Marca || connection.model('Marca', MarcaSchema);
    return await Model.find().sort({ nome: 1 });
  }

  static async delete(id, connection) {
    if (typeof id !== 'string') return null;
    const Model = connection.models.Marca || connection.model('Marca', MarcaSchema);
    const marca = await Model.findOneAndDelete({ _id: id });

    if (marca) {
      const SyncQueue = connection.models.SyncQueue || connection.model('SyncQueue', SyncQueueSchema);
      await SyncQueue.create({
        collectionName: 'Marca',
        action: 'delete',
        payload: { _id: id },
      });
    }
    return marca;
  }
}

module.exports = { Marca, MarcaSchema };