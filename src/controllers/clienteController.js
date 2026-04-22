const { Cliente } = require('../models/ClienteModel');
const { connectLocal } = require('../db/connections');

exports.index = (req, res) => {
    res.render('cliente/cadastroCliente', { cliente: {} });
};

exports.list = async (req, res) => {
    const localConn = await connectLocal();
    const clientes = await Cliente.buscaClientes(localConn);
    res.render('cliente/index', { clientes });
};

exports.register = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const cliente = new Cliente(req.body, localConn);
        await cliente.register();

        if (cliente.errors.length > 0) {
            req.flash('errors', cliente.errors);
            return req.session.save(() => res.redirect('/cliente/list'));
        }

        req.flash('success', 'Cliente registrado com sucesso');
        return req.session.save(() => res.redirect(`/cliente/load/${cliente.cliente.id}`));
    } catch (e) {
        console.log(e);
        return res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();
    const cliente = await Cliente.buscaPorID(req.params.id, localConn);

    if (!cliente) return res.render('404');
    res.render('cliente/cadastroCliente', { cliente });
};

exports.edit = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const localConn = await connectLocal();
        const cliente = new Cliente(req.body, localConn);
        await cliente.edit(req.params.id);

        if (cliente.errors.length > 0) {
            req.flash('errors', cliente.errors);
            return req.session.save(() => res.redirect('/cliente/list'));
        }

        req.flash('success', 'Cliente atualizado com sucesso');
        return req.session.save(() => res.redirect(`/cliente/load/${cliente.cliente.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.delete = async (req, res) => {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();
    const cliente = await Cliente.delete(req.params.id, localConn);

    if (!cliente) return res.render('404');
    req.flash('success', 'Cliente apagado com sucesso');
    req.session.save(() => res.redirect('/cliente/list')); // Ajuste para sua rota de listagem
};