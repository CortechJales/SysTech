const mongoose = require('mongoose');
const SyncQueueSchema = require('./SyncQueueModel');

const ClienteSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cep: { type: String, required: false, default: '' },
    endereco: { type: String, required: false, default: '' },
    cidade: { type: String, required: false, default: '' },
    estado: { type: String, required: false, default: '' },
    cpf_cnpj: { type: String, required: false, default: '' },
    telefone: { type: String, required: false, default: '' },
    telefone2: { type: String, required: false, default: '' },
    ativo: { type: Boolean, required: false, default: true},
    criadoEm: { type: Date, default: Date.now },
});

class Cliente {
    constructor(body, connection) {
        this.body = body;
        this.errors = [];
        this.cliente = null;
        this.connection = connection;
        // Instancia o modelo na conexão atual
        this.Model = connection.models.Cliente || connection.model('Cliente', ClienteSchema);
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;

        this.cliente = await this.Model.create(this.body);

        // 🔥 Enfileira para sincronização
        await this.addToQueue('create', this.cliente.toObject());
    }

    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;

        this.cliente = await this.Model.findByIdAndUpdate(id, this.body, { new: true });
        
        // 🔥 Enfileira edição (mandamos o ID e o novo corpo)
        await this.addToQueue('update', { _id: id, ...this.body });
    }

    async addToQueue(action, payload) {
        const SyncQueue = this.connection.models.SyncQueue || this.connection.model('SyncQueue', SyncQueueSchema);
        await SyncQueue.create({
            collectionName: 'Cliente',
            action: action,
            payload: payload,
        });
    }

    valida() {
        this.cleanUp();
        if (!this.body.nome) this.errors.push('Nome é obrigatório');
        if (!this.body.telefone) {
            this.errors.push('O telefone é obrigatório para contato.');
        }
    }

    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') this.body[key] = '';
        }
        this.body = {
            nome: this.body.nome,
            cep: this.body.cep,
            endereco: this.body.endereco,
            cidade: this.body.cidade,
            estado: this.body.estado,
            cpf_cnpj: this.body.cpf_cnpj,
            telefone: this.body.telefone,
            telefone2: this.body.telefone2
        };
    }

    // Métodos estáticos adaptados para receber conexão
    static async buscaPorID(id, connection) {
        if (typeof id !== 'string') return;
        const Model = connection.models.Cliente || connection.model('Cliente', ClienteSchema);
        return await Model.findById(id);
    }

    static async buscaClientes(connection) {
        const Model = connection.models.Cliente || connection.model('Cliente', ClienteSchema);
        return await Model.find().sort({ criadoEm: 1 });
    }

    static async delete(id, connection) {
        if (typeof id !== 'string') return;
        const Model = connection.models.Cliente || connection.model('Cliente', ClienteSchema);
        const cliente = await Model.findOneAndDelete({ _id: id });

        // 🔥 Enfileira deleção
        const SyncQueue = connection.models.SyncQueue || connection.model('SyncQueue', SyncQueueSchema);
        await SyncQueue.create({
            collectionName: 'Cliente',
            action: 'delete',
            payload: { _id: id },
        });

        return cliente;
    }
}

module.exports = { Cliente, ClienteSchema };