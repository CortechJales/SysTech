const mongoose = require('mongoose');
const SyncQueueSchema = require('./SyncQueueModel');
const { ClienteSchema } = require('./ClienteModel');
const { MarcaSchema } = require('./MarcaModel');

const EquipamentoSchema = new mongoose.Schema({
    modelo: { type: String, required: true },
    configuracao: { type: String, default: '' }, // Novo campo para TI
    marca: { type: mongoose.Schema.Types.ObjectId, ref: 'Marca', required: true }, 
    defeito: { type: String, default: '' },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
});

class Equipamento {
    constructor(body, connection) {
        this.body = body;
        this.errors = [];
        this.equipamento = null;
        this.connection = connection;
        this.Model = connection.models.Equipamento || connection.model('Equipamento', EquipamentoSchema);
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.equipamento = await this.Model.create(this.body);
        await this.addToQueue('create', this.equipamento.toObject());
    }

    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;
        this.equipamento = await this.Model.findByIdAndUpdate(id, this.body, { new: true });
        await this.addToQueue('update', { _id: id, ...this.body });
    }

    async addToQueue(action, payload) {
        const SyncQueue = this.connection.models.SyncQueue || this.connection.model('SyncQueue', SyncQueueSchema);
        await SyncQueue.create({
            collectionName: 'Equipamento',
            action: action,
            payload: payload,
        });
    }

    valida() {
        this.cleanUp();
        if (!this.body.modelo) this.errors.push('Modelo é um campo obrigatório.');
        if (!this.body.cliente) this.errors.push('O equipamento precisa estar vinculado a um cliente.');
    }

    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') this.body[key] = '';
        }

        this.body = {
            modelo: this.body.modelo,
            configuracao: this.body.configuracao,
            marca: this.body.marca,
            defeito: this.body.defeito,
            cliente: this.body.cliente,
            ativo: this.body.ativo === 'false' ? false : true
        };
    }

    // --- MÉTODOS ESTÁTICOS ---
    static async buscaPorId(id, connection) {
        if (typeof id !== 'string') return;
        connection.models.Marca || connection.model('Marca', MarcaSchema);
        connection.models.Cliente || connection.model('Cliente', ClienteSchema);
        const Model = connection.models.Equipamento || connection.model('Equipamento', EquipamentoSchema);
        return await Model.findById(id).populate('cliente').populate('marca');
    }

    static async buscaEquipamentos(connection) {
        connection.models.Marca || connection.model('Marca', MarcaSchema);
        connection.models.Cliente || connection.model('Cliente', ClienteSchema);
        const Model = connection.models.Equipamento || connection.model('Equipamento', EquipamentoSchema);
        return await Model.find().populate('cliente').populate('marca').sort({ criadoEm: -1 });
    }

    // 🔥 NOVO MÉTODO: Busca específica por cliente
    static async buscaPorCliente(clienteId, connection) {
        if (typeof clienteId !== 'string') return;
        connection.models.Marca || connection.model('Marca', MarcaSchema);
        connection.models.Cliente || connection.model('Cliente', ClienteSchema);
        const Model = connection.models.Equipamento || connection.model('Equipamento', EquipamentoSchema);
        return await Model.find({ cliente: clienteId }).populate('marca').sort({ criadoEm: -1 });
    }

    static async delete(id, connection) {
        if (typeof id !== 'string') return;
        const Model = connection.models.Equipamento || connection.model('Equipamento', EquipamentoSchema);
        const equipamento = await Model.findOneAndDelete({ _id: id });
        if (equipamento) {
            const SyncQueue = connection.models.SyncQueue || connection.model('SyncQueue', SyncQueueSchema);
            await SyncQueue.create({ collectionName: 'Equipamento', action: 'delete', payload: { _id: id } });
        }
        return equipamento;
    }
}

module.exports = { Equipamento, EquipamentoSchema };