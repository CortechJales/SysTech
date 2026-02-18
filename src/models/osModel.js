const mongoose = require('mongoose');

const OrdemServicoSchema = new mongoose.Schema({
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    equipamento: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipamento', required: true },
    data_inicio: { type: Date, default: Date.now },
    data_final: { type: Date },
    itens: [{
        descricao: String,
        quantidade: Number,
        valorUnitario: Number,
        valorTotalItem: Number
    }],
    mao_de_obra: { type: Number, default: 0 },
    valorTotalGeral: { type: Number, default: 0 }, // Soma dos itens + mão de obra
    valor_total: { type: Number, default: 0 },     // Campo espelho para compatibilidade
    observacao: { type: String, default: '' },
    status: { 
        type: String, 
        enum: ['Em orçamento', 'Aguardando cliente', 'Em execução', 'Atendido', 'Fechado'],
        default: 'Em orçamento'
    },
    data_orcamento_passado: { type: Date },
    data_orcamento_aprovado: { type: Date },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
});

const OSModel = mongoose.models.OrdemServico || mongoose.model('OrdemServico', OrdemServicoSchema);

class OrdemServico {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.os = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.calculaTotais();
        this.os = await OSModel.create(this.body);
    }
    async edit(id) {
        if (typeof id !== 'string') return;
        
        // 1. Busca a OS atual no banco para verificações de segurança
        const osNoBanco = await OSModel.findById(id);
        if (!osNoBanco) return;

        // 2. Trava de segurança: Se já estava fechada, não permite re-editar
        if (osNoBanco.status === 'Fechado') {
            this.errors.push('Esta OS está fechada e não pode ser alterada.');
            return;
        }

        // 3. Lógica da Data Final Automática:
        // Se o novo status enviado for "Fechado", setamos a data_final agora
        if (this.body.status === 'Fechado') {
            this.body.data_final = new Date(); 
        }

        this.valida();
        if (this.errors.length > 0) return;
        
        this.calculaTotais();
        
        // 4. Atualiza no banco
        this.os = await OSModel.findByIdAndUpdate(id, this.body, { new: true });
    }
    

    valida() {
        if (!this.body.cliente) this.errors.push('Cliente é obrigatório.');
        if (!this.body.equipamento) this.errors.push('Equipamento é obrigatório.');
        if (!Array.isArray(this.body.itens)) this.body.itens = [];
    }

    calculaTotais() {
        let totalItens = 0;
        const maoDeObra = Number(this.body.mao_de_obra) || 0;

        this.body.itens = this.body.itens.map(item => {
            const qtd = Number(item.quantidade) || 0;
            const valorUn = Number(item.valorUnitario) || 0;
            const subTotal = qtd * valorUn;
            totalItens += subTotal;
            return {
                descricao: item.descricao,
                quantidade: qtd,
                valorUnitario: valorUn,
                valorTotalItem: subTotal
            };
        });

        const totalGeral = totalItens + maoDeObra;
        this.body.valorTotalGeral = totalGeral;
        this.body.valor_total = totalGeral; // Mantém ambos os campos atualizados
    }

    static async buscaPorId(id) {
        if (typeof id !== 'string') return;
        return await OSModel.findById(id)
            .populate('cliente')
            .populate({ path: 'equipamento', populate: { path: 'marca' } });
    }

    static async buscaTodos() {
        return await OSModel.find({ ativo: true })
            .populate('cliente')
            .populate('equipamento')
            .sort({ criadoEm: -1 });
    }
}

module.exports = OrdemServico;