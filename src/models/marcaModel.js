const mongoose = require('mongoose');

const MarcaSchema = new mongoose.Schema({
    descricao: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now },
});

const MarcaModel = mongoose.models.Marca || mongoose.model('Marca', MarcaSchema);

class Marca {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.marca = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.marca = await MarcaModel.create(this.body);
             
    }
    valida() {
        this.cleanUp();
        if(!this.body.descricao) this.errors.push('Descrição é obrigatória');
        
    }
    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') {
                this.body[key] = '';
            }
        }
        this.body = {
            descricao: this.body.descricao
        };
    }
    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;
        this.marca = await MarcaModel.findByIdAndUpdate(id, this.body, { new: true });
    }

    //Métodos estáticos
    static async buscaPorID(id) {
        if (typeof id !== 'string') return;
        const marca = await MarcaModel.findById(id);
        return marca;
    };    
    static async buscaProduto() {
        const marcas = await MarcaModel.find().sort({ descricao: 1 });
        return marcas;
    }
    static async delete(id) {
        if (typeof id !== 'string') return;
        const marca = await MarcaModel.findOneAndDelete({_id:id});
        return marca;
    };
}



module.exports = Marca;