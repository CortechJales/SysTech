const mongoose = require('mongoose');
const validator = require('validator');

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

const ClienteModel =
  mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);

class Cliente {
    constructor(body) {
        this.body = body;
        this.errors = [];
        this.cliente = null;
    }

    async register() {
        this.valida();
        if (this.errors.length > 0) return;
        this.cliente = await ClienteModel.create(this.body);
    }

    valida() {
        this.cleanUp();
        if (!this.body.nome) this.errors.push('Nome é obrigatório');
        if (!this.body.email && !this.body.telefone) {
            this.errors.push('Pelo menos um contato precisa ser enviado: telefone.');
        }
    }
    cleanUp() {
        for (const key in this.body) {
            if (typeof this.body[key] !== 'string') {
                this.body[key] = '';
            }
        }
        this.body = {
            nome: this.body.nome,
            cep:this.body.cep,
            endereco:this.body.endereco ,
            cidade: this.body.cidade,
            estado:this.body.estado,
            cpf_cnpj:this.body.cpf_cnpj,
            telefone:this.body.telefone,
            telefone2: this.body.telefone2
        };
    }
    async edit(id) {
        if (typeof id !== 'string') return;
        this.valida();
        if (this.errors.length > 0) return;
        this.cliente = await ClienteModel.findByIdAndUpdate(id, this.body, { new: true });
    }

    //Nétodos estáticos
    static async buscaPorID(id) {
        if (typeof id !== 'string') return;
        const cliente = await ClienteModel.findById(id);
        return cliente;
    };
    static async buscaClientes() {
        const clientes = await ClienteModel.find()
        .sort({ criadoEm :1 });
        return clientes;
    };
    static async delete(id) {
        if (typeof id !== 'string') return;
        const cliente = await ClienteModel.findOneAndDelete({_id:id});
        return cliente;
    };
}


module.exports = Cliente;