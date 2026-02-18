const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
    codigo: { type: Number },
    descricao: { type: String, required: true },
    valorVenda: { type: Number, required: true },
    ativo: { type: Boolean, default: true } // Novo campo para controle de exclusão lógica
});

const ProdutoModel = mongoose.models.Produto || mongoose.model('Produto', ProdutoSchema);

class Produto {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.produto = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;

        // Busca o último produto pelo código mais alto
        const ultimoProduto = await ProdutoModel.findOne().sort({ codigo: -1 });
        
        // CORREÇÃO: Verificamos se ultimoProduto existe E se o código é um número válido
        let novoCodigo = 1;
        if (ultimoProduto && !isNaN(ultimoProduto.codigo)) {
            novoCodigo = Number(ultimoProduto.codigo) + 1;
        }

        // Atribuímos o código ao corpo do objeto antes de criar
        this.body.codigo = novoCodigo;
        this.body.ativo = true;

        this.produto = await ProdutoModel.create(this.body);
    }

    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') {
                this.body[key] = '';
            }
        }
        
        // IMPORTANTE: Não inclua o campo 'codigo' no cleanUp se ele vier do formulário,
        // pois o código deve ser gerado apenas pelo servidor para evitar fraudes.
        this.body = {
            descricao: this.body.descricao,
            valorVenda: parseFloat(this.body.valorVenda) || 0 // Garante que o valor de venda seja número
        };
}

    valida() {
        this.cleanUp();
        if (!this.body.descricao) this.errors.push('Descrição é obrigatória');
        if (isNaN(parseFloat(this.body.valorVenda))) this.errors.push('Valor Venda precisa ser um número');
    }

       async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;
        this.produto = await ProdutoModel.findByIdAndUpdate(id, this.body, { new: true });
    }

    static async buscaPorID(id) {
        if (typeof id !== 'string') return;
        return await ProdutoModel.findById(id);
    }

    static async buscaProduto() {
        // Retorna apenas produtos ativos para a listagem e para o catálogo da OS
        return await ProdutoModel.find({ ativo: true }).sort({ codigo: 1 });
    }

    // Alterado para Inativar em vez de apagar
    static async inativar(id) {
        if (typeof id !== 'string') return;
        const produto = await ProdutoModel.findByIdAndUpdate(id, { ativo: false }, { new: true });
        return produto;
    };
}

module.exports = Produto;