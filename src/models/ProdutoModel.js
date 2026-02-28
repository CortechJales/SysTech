const mongoose = require('mongoose');
const SyncQueueSchema = require('./SyncQueueModel');

const ProdutoSchema = new mongoose.Schema({
    codigo: { type: Number },
    descricao: { type: String, required: true },
    valorVenda: { type: Number, required: true },
    ativo: { type: Boolean, default: true } 
});

class Produto {
    constructor(body, connection) {
        this.body = body;
        this.errors = [];
        this.produto = null;
        this.connection = connection;
        this.Model = connection.models.Produto || connection.model('Produto', ProdutoSchema);
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;

        // Busca o último código na conexão atual
        const ultimoProduto = await this.Model.findOne().sort({ codigo: -1 });
        
        let novoCodigo = 1;
        if (ultimoProduto && !isNaN(ultimoProduto.codigo)) {
            novoCodigo = Number(ultimoProduto.codigo) + 1;
        }

        this.body.codigo = novoCodigo;
        this.body.ativo = true;

        this.produto = await this.Model.create(this.body);

        // 🔥 Enfileira criação
        await this.addToQueue('create', this.produto.toObject());
    }

    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;

        this.produto = await this.Model.findByIdAndUpdate(id, this.body, { new: true });
        
        // 🔥 Enfileira edição
        await this.addToQueue('update', { _id: id, ...this.body });
    }

    async addToQueue(action, payload) {
        const SyncQueue = this.connection.models.SyncQueue || this.connection.model('SyncQueue', SyncQueueSchema);
        await SyncQueue.create({
            collectionName: 'Produto',
            action: action,
            payload: payload,
        });
    }

    valida() {
        this.cleanUp();
        if (!this.body.descricao) this.errors.push('Descrição é obrigatória');
        if (isNaN(parseFloat(this.body.valorVenda))) this.errors.push('Valor Venda precisa ser um número');
    }

    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') this.body[key] = '';
        }
        
        this.body = {
            descricao: this.body.descricao,
            valorVenda: parseFloat(this.body.valorVenda) || 0
        };
    }

    // Métodos estáticos com injeção de conexão
    static async buscaPorID(id, connection) {
        if (typeof id !== 'string') return;
        const Model = connection.models.Produto || connection.model('Produto', ProdutoSchema);
        return await Model.findById(id);
    }

    static async buscaProduto(connection) {
        const Model = connection.models.Produto || connection.model('Produto', ProdutoSchema);
        return await Model.find({ ativo: true }).sort({ codigo: 1 });
    }

    static async inativar(id, connection) {
        if (typeof id !== 'string') return;
        const Model = connection.models.Produto || connection.model('Produto', ProdutoSchema);
        const produto = await Model.findByIdAndUpdate(id, { ativo: false }, { new: true });

        if (produto) {
            const SyncQueue = connection.models.SyncQueue || connection.model('SyncQueue', SyncQueueSchema);
            await SyncQueue.create({
                collectionName: 'Produto',
                action: 'update', // Inativação é um update do campo 'ativo'
                payload: { _id: id, ativo: false },
            });
        }
        return produto;
    }
}

module.exports = { Produto, ProdutoSchema };