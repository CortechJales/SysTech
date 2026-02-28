const { Produto } = require('../models/ProdutoModel');
const { connectLocal } = require('../db/connections');

exports.index = (req, res) => {
    res.render('produto/cadastroProduto', { produto: {} });
};

exports.list = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const produtos = await Produto.buscaProduto(localConn);
        res.render('produto/index', { produtos });
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.register = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const produto = new Produto(req.body, localConn);
        await produto.register();

        if (produto.errors.length > 0) {
            req.flash('errors', produto.errors);
            return req.session.save(() => res.redirect('/produto/new'));
        }

        req.flash('success', 'Produto registrado com sucesso');
        req.session.save(() => res.redirect(`/produto/load/${produto.produto.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const localConn = await connectLocal();
        const produto = await Produto.buscaPorID(req.params.id, localConn);
        if (!produto) return res.render('404');

        res.render('produto/cadastroProduto', { produto });
    } catch (e) {
        res.render('404');
    }
};

exports.edit = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const localConn = await connectLocal();
        const produto = new Produto(req.body, localConn);
        await produto.edit(req.params.id);

        if (produto.errors.length > 0) {
            req.flash('errors', produto.errors);
            return req.session.save(() => res.redirect('/produto/list'));
        }

        req.flash('success', 'Produto atualizado com sucesso');
        req.session.save(() => res.redirect(`/produto/load/${req.params.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.delete = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const localConn = await connectLocal();
        const produto = await Produto.inativar(req.params.id, localConn);

        if (!produto) return res.render('404');

        req.flash('success', 'Produto inativado com sucesso.');
        req.session.save(() => res.redirect('/produto/list'));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};