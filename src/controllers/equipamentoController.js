const { Equipamento } = require('../models/EquipamentoModel');
const { Marca } = require('../models/MarcaModel');
const { connectLocal } = require('../db/connections');

// Exibe formulário de NOVO equipamento
exports.index = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const localConn = await connectLocal();
        // Busca marcas para o select do formulário
        const marcas = await Marca.buscaMarcas(localConn); 
        
        res.render('equipamento/cadastroEquipamento', { 
            equipamento: {}, 
            clienteId, 
            marcas 
        });
    } catch (e) {
        console.error(e);
        res.render('404');
    }
};

// LISTAGEM de todos os equipamentos
exports.list = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const equipamentos = await Equipamento.buscaEquipamentos(localConn);
        res.render('equipamento/index', { equipamentos });
    } catch (e) {
        console.error(e);
        res.render('404');
    }
};

// 🔥 CARREGA DADOS PARA EDIÇÃO (O que faltava)
exports.editIndex = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const localConn = await connectLocal();
        
        // Buscamos o equipamento e as marcas em paralelo para ganhar tempo
        const [equipamento, marcas] = await Promise.all([
            Equipamento.buscaPorId(req.params.id, localConn),
            Marca.buscaMarcas(localConn)
        ]);

        if (!equipamento) return res.render('404');

        // Passamos o clienteId separadamente para facilitar no formulário
        res.render('equipamento/cadastroEquipamento', { 
            equipamento, 
            clienteId: equipamento.cliente._id,
            marcas 
        });
    } catch (e) {
        console.error(e);
        res.render('404');
    }
};

exports.register = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const equipamento = new Equipamento(req.body, localConn);
        await equipamento.register();

        if (equipamento.errors.length > 0) {
            req.flash('errors', equipamento.errors);
            return req.session.save(() => res.redirect('back'));
        }

        req.flash('success', 'Equipamento cadastrado com sucesso.');
        // Redireciona para carregar o equipamento recém criado
        req.session.save(() => res.redirect(`/equipamento/load/${equipamento.equipamento._id}`));
    } catch (e) {
        console.error(e);
        res.render('404');
    }
};

exports.edit = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const equipamento = new Equipamento(req.body, localConn);
        await equipamento.edit(req.params.id);

        if (equipamento.errors.length > 0) {
            req.flash('errors', equipamento.errors);
            return req.session.save(() => res.redirect('back'));
        }

        req.flash('success', 'Equipamento atualizado com sucesso.');
        req.session.save(() => res.redirect(`/equipamento/load/${req.params.id}`));
    } catch (e) {
        console.error(e);
        res.render('404');
    }
};

exports.delete = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const localConn = await connectLocal();
        const equipamento = await Equipamento.delete(req.params.id, localConn);

        if (!equipamento) return res.render('404');
        
        req.flash('success', 'Equipamento apagado com sucesso.');
        req.session.save(() => res.redirect('/equipamento/list'));
    } catch (e) {
        console.error(e);
        res.render('404');
    }
};