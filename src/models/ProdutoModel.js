const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
    descricao: { type: String, required: true },
    valorVenda: { type: Number, required: true }
});

const ProdutoModel = mongoose.models.produto || mongoose.model('Produto', ProdutoSchema);

class Produto {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.produto = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.produto = await ProdutoModel.create(this.body);
       
    }
    valida() {
        this.cleanUp();
        if(!this.body.descricao) this.errors.push('Descrição é obrigatória');
        if (!this.body.valorVenda) this.errors.push('Valor Venda é obrigatório');
        
    }
    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') {
                this.body[key] = '';
            }
        }
        this.body = {
            descricao: this.body.descricao,
            valorVenda:this.body.valorVenda
        };
    }
    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;
        this.produto = await ProdutoModel.findByIdAndUpdate(id, this.body, { new: true });
    }

    //Métodos estáticos
    static async buscaPorID(id) {
        if (typeof id !== 'string') return;
        const produto = await ProdutoModel.findById(id);
        return produto;
    };    
    static async buscaProduto() {
        const produtos = await ProdutoModel.find().sort({ descricao: 1 });
        return produtos;
    }
    static async delete(id) {
        if (typeof id !== 'string') return;
        const produto = await ProdutoModel.findOneAndDelete({_id:id});
        return produto;
    };
}



module.exports = Produto;