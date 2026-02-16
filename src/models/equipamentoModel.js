const mongoose = require('mongoose');

const EquipamentoSchema = new mongoose.Schema({
    modelo: { type: String, required: true },
    rpm: { type: String, default: '' },
    polos: { type: String, default: '' },
    fases: { type: String, default: '' },
    tensao: { type: String, default: '' },
    // Referência para a marca
    marca: { type: mongoose.Schema.Types.ObjectId, ref: 'Marca', required: true }, 
    defeito: { type: String, default: '' },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
});
const EquipamentoModel = mongoose.models.Equipamento || mongoose.model('Equipamento', EquipamentoSchema);

class Equipamento {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.equipamento = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.equipamento = await EquipamentoModel.create(this.body);
    }

    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;
        this.equipamento = await EquipamentoModel.findByIdAndUpdate(id, this.body, { new: true });
    }

    valida() {
        this.cleanUp();
        if (!this.body.modelo) this.errors.push('Modelo é um campo obrigatório.');
        if (!this.body.cliente) this.errors.push('O equipamento precisa estar vinculado a um cliente.');
    }

    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') {
                this.body[key] = '';
            }
        }

        this.body = {
            modelo: this.body.modelo,
            rpm: this.body.rpm,
            polos: this.body.polos,
            fases: this.body.fases,
            tensao: this.body.tensao,
            marca: this.body.marca,
            defeito: this.body.defeito,
            cliente: this.body.cliente,
            ativo: this.body.ativo === 'false' ? false : true
        };
    }

    static async buscaPorId(id) {
    if (typeof id !== 'string') return;
    return await EquipamentoModel.findById(id)
        .populate('cliente')
        .populate('marca'); // Traz a descrição da marca automaticamente
}

    static async buscaPorCliente(clienteId) {
        if (typeof clienteId !== 'string') return;
        return await EquipamentoModel.find({ cliente: clienteId }).sort({ criadoEm: -1 });
    }
}

module.exports = Equipamento;