const mongoose = require('mongoose');
const SyncQueueSchema = require('./SyncQueueModel');

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
    valorTotalGeral: { type: Number, default: 0 },
    valor_total: { type: Number, default: 0 },
    observacao: { type: String, default: '' },
    status: { 
        type: String, 
        enum: ['Em orçamento', 'Aguardando cliente', 'Em execution', 'Atendido', 'Fechado'],
        default: 'Em orçamento'
    },
    data_orcamento_passado: { type: Date },
    data_orcamento_aprovado: { type: Date },
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
});

class OrdemServico {
    constructor(body, connection) {
        this.body = body;
        this.errors = [];
        this.os = null;
        this.connection = connection;
        this.Model = connection.models.OrdemServico || connection.model('OrdemServico', OrdemServicoSchema);
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.calculaTotais();
        this.os = await this.Model.create(this.body);
        
        await this.addToQueue('create', this.os.toObject());
    }

    async edit(id) {
        if (typeof id !== 'string') return;
        
        const osNoBanco = await this.Model.findById(id);
        if (!osNoBanco) return;

        if (osNoBanco.status === 'Fechado') {
            this.errors.push('Esta OS está fechada e não pode ser alterada.');
            return;
        }

        if (this.body.status === 'Fechado') {
            this.body.data_final = new Date(); 
        }

        this.valida();
        if (this.errors.length > 0) return;
        this.calculaTotais();
        
        this.os = await this.Model.findByIdAndUpdate(id, this.body, { new: true });
        await this.addToQueue('update', { _id: id, ...this.body });
    }

    async addToQueue(action, payload) {
        const SyncQueue = this.connection.models.SyncQueue || this.connection.model('SyncQueue', SyncQueueSchema);
        await SyncQueue.create({
            collectionName: 'OrdemServico',
            action: action,
            payload: payload,
        });
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
        this.body.valor_total = totalGeral;
    }

    static async buscaPorId(id, connection) {
        if (typeof id !== 'string') return;
        const Model = connection.models.OrdemServico || connection.model('OrdemServico', OrdemServicoSchema);
        return await Model.findById(id)
            .populate('cliente')
            .populate({ path: 'equipamento', populate: { path: 'marca' } });
    }

    static async buscaTodos(connection) {
        const Model = connection.models.OrdemServico || connection.model('OrdemServico', OrdemServicoSchema);
        return await Model.find({ ativo: true })
            .populate('cliente')
            .populate('equipamento')
            .sort({ criadoEm: -1 });
    }
    
    static async relatorio(filtros, connection) {
    const Model = connection.models.OrdemServico || connection.model('OrdemServico', OrdemServicoSchema);

    // 📌 Registrar models (multi-connection safe)

    if (!connection.models.Cliente) {
        const { ClienteSchema } = require('./ClienteModel');
        connection.model('Cliente', ClienteSchema);
    }
    const ClienteModel = connection.models.Cliente;

    if (!connection.models.Equipamento) {
        const { EquipamentoSchema } = require('./EquipamentoModel');
        connection.model('Equipamento', EquipamentoSchema);
    }
    const EquipamentoModel = connection.models.Equipamento;

    if (!connection.models.Marca) {
        const { MarcaSchema } = require('./MarcaModel');
        connection.model('Marca', MarcaSchema);
    }

    const query = { ativo: true };

    // 📅 DATA (CORRIGIDO)
    if (filtros.dataInicio || filtros.dataFim) {
        query.data_inicio = {};

        if (filtros.dataInicio) {
            const inicio = new Date(filtros.dataInicio);
            inicio.setHours(0, 0, 0, 0);
            query.data_inicio.$gte = inicio;
        }

        if (filtros.dataFim) {
            const fim = new Date(filtros.dataFim);
            fim.setHours(23, 59, 59, 999);
            query.data_inicio.$lte = fim;
        }
    }

    // 👤 CLIENTE (nome parcial)
    if (filtros.nomeCliente) {
        const clientes = await ClienteModel.find({
            nome: { $regex: filtros.nomeCliente, $options: 'i' }
        });

        query.cliente = { $in: clientes.map(c => c._id) };
    }

    // 🔧 EQUIPAMENTO (modelo + descrição)
    if (filtros.equipamento) {
        const equipamentos = await EquipamentoModel.find({
            $or: [
                { modelo: { $regex: filtros.equipamento, $options: 'i' } },
                { descricao: { $regex: filtros.equipamento, $options: 'i' } }
            ]
        });

        query.equipamento = { $in: equipamentos.map(e => e._id) };
    }

    // 📊 STATUS
    if (filtros.status && filtros.status.length > 0) {
        query.status = { $in: filtros.status };
    }

    // 💰 VALOR
    if (filtros.valorMin || filtros.valorMax) {
        query.valorTotalGeral = {};

        if (filtros.valorMin) {
            query.valorTotalGeral.$gte = Number(filtros.valorMin);
        }

        if (filtros.valorMax) {
            query.valorTotalGeral.$lte = Number(filtros.valorMax);
        }
    }

    // 🔍 ITEM (descrição)
    if (filtros.item) {
        query['itens.descricao'] = {
            $regex: filtros.item,
            $options: 'i'
        };
    }

    // 🚀 EXECUÇÃO
    return await Model.find(query)
        .populate('cliente')
        .populate({
            path: 'equipamento',
            populate: { path: 'marca' }
        })
        .sort({ data_inicio: -1 }) // também ajustado aqui 👈
        .lean();
}
        }

module.exports = { OrdemServico, OrdemServicoSchema };