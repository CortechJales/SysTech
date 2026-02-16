const Orcamento = require('../models/orcamentoModel');
const Peca = require('../models/pecaModel'); // Para listar no select
const Cliente = require('../models/ClienteModel');
const Equipamento = require('../models/equipamentoModel');

exports.index = async (req, res) => {
    try {
        const { clienteId, equipamentoId } = req.params;
        const pecas = await Peca.buscaPecas(); // Busca do catálogo

        res.render('orcamento', { 
            orcamento: {}, 
            clienteId, 
            equipamentoId, 
            pecas 
        });
    } catch (e) {
        res.render('404');
    }
};

exports.register = async (req, res) => {
    try {
        const orcamento = new Orcamento(req.body);
        await orcamento.register();

        if (orcamento.errors.length > 0) {
            req.flash('errors', orcamento.errors);
            req.session.save(() => res.redirect('back'));
            return;
        }

        req.flash('success', 'Orçamento salvo com sucesso!');
        req.session.save(() => res.redirect(`/orcamento/index/${orcamento.orcamento._id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        
        const orcamento = await Orcamento.buscaPorId(req.params.id);
        if (!orcamento) return res.render('404');

        const pecas = await Peca.buscaPecas();

        res.render('orcamento', { 
            orcamento, 
            clienteId: orcamento.cliente._id, 
            equipamentoId: orcamento.equipamento._id, 
            pecas 
        });
    } catch (e) {
        res.render('404');
    }
};

exports.edit = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const orcamento = new Orcamento(req.body);
        await orcamento.edit(req.params.id);

        if (orcamento.errors.length > 0) {
            req.flash('errors', orcamento.errors);
            req.session.save(() => res.redirect('back'));
            return;
        }

        req.flash('success', 'Orçamento atualizado!');
        req.session.save(() => res.redirect('back'));
    } catch (e) {
        res.render('404');
    }
};