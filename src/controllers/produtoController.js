const Produto = require('../models/ProdutoModel');

exports.index = (req, res) => {
    res.render('produto/cadastroProduto', { produto: {} });
};

exports.list = async (req, res) => {
    try {
        const produtos = await Produto.buscaProduto();
        res.render('produto/index', { produtos });
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.register = async (req, res) => {
    try {
        const produto = new Produto(req.body);
        await produto.register();

        if (produto.errors.length > 0) {
            req.flash('errors', produto.errors);
            req.session.save(() => res.redirect('/produto/new'));
            return;
        }

        req.flash('success', 'Produto registrado com sucesso');
        // Redireciona para a edição do produto recém criado
        req.session.save(() => res.redirect(`/produto/load/${produto.produto.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    if (!req.params.id) return res.render('404');

    const produto = await Produto.buscaPorID(req.params.id);
    if (!produto) return res.render('404');

    res.render('produto/cadastroProduto', { produto });
};

exports.edit = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const produto = new Produto(req.body);
        await produto.edit(req.params.id);

        if (produto.errors.length > 0) {
            req.flash('errors', produto.errors);
            req.session.save(() => res.redirect('produto/list'));
            return;
        }

        req.flash('success', 'Produto atualizado com sucesso');
        req.session.save(() => res.redirect(`/produto/load/${req.params.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

// ... outros métodos se mantêm iguais

exports.delete = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        
        // Agora chama a inativação
        const produto = await Produto.inativar(req.params.id);

        if (!produto) return res.render('404');

        req.flash('success', 'Produto inativado com sucesso. Ele não aparecerá mais nas listas.');
        req.session.save(() => res.redirect('/produto/list'));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};