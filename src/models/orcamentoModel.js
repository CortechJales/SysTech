const mongoose = require('mongoose');

const OrcamentoSchema = new mongoose.Schema({
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    equipamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipamento', required: true },
    descricaoServico: { type: String, required: true },
    itens: [{
        descricao: String,
        quantidade: Number,
        valorUnitario: Number,
        valorTotalItem: Number
    }],
    valorTotalGeral: { type: Number, default: 0 },
    status: { type: String, default: 'PENDENTE' },
    criadoEm: { type: Date, default: Date.now },
});

const OrcamentoModel = mongoose.models.Orcamento || mongoose.model('Orcamento', OrcamentoSchema);

class Orcamento {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.orcamento = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;

        this.calculaTotais();
        this.orcamento = await OrcamentoModel.create(this.body);
    }

    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;

        this.calculaTotais();
        this.orcamento = await OrcamentoModel.findByIdAndUpdate(id, this.body, { new: true });
    }

    valida() {
        this.cleanUp();
        if (!this.body.cliente) this.errors.push('ID do cliente inválido.');
        if (!this.body.equipamento) this.errors.push('ID do equipamento inválido.');
        if (!this.body.descricaoServico) this.errors.push('A descrição do serviço é obrigatória.');
        if (this.body.itens.length === 0) this.errors.push('Adicione pelo menos uma peça ou serviço.');
    }

    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string' && key !== 'itens') {
                this.body[key] = '';
            }
        }

        this.body = {
            cliente: this.body.cliente,
            equipamento: this.body.equipamento,
            descricaoServico: this.body.descricaoServico,
            status: this.body.status || 'PENDENTE',
            itens: Array.isArray(this.body.itens) ? this.body.itens : []
        };
    }

    calculaTotais() {
        let total = 0;
        this.body.itens = this.body.itens.map(item => {
            const qtd = Number(item.quantidade) || 0;
            const valorUn = Number(item.valorUnitario) || 0;
            const subTotal = qtd * valorUn;
            total += subTotal;
            
            return {
                descricao: item.descricao,
                quantidade: qtd,
                valorUnitario: valorUn,
                valorTotalItem: subTotal
            };
        });
        this.body.valorTotalGeral = total;
    }

    static async buscaPorId(id) {
        if (typeof id !== 'string') return;
        return await OrcamentoModel.findById(id).populate('cliente').populate('equipamento');
    }

    static async buscaOrcamentos() {
        return await OrcamentoModel.find().populate('cliente').populate('equipamento').sort({ criadoEm: -1 });
    }
}

module.exports = Orcamento;