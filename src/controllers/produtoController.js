const Produto = require('../models/ProdutoModel');


exports.index = (req, res) => {
    res.render('produto/cadastroProduto', { produto: {} });
};

exports.register = async (req, res) => {
    try {
        const produto = new Produto(req.body);
        await produto.register();

        if (produto.errors.length > 0) {
            req.flash('errors', produto.errors);
            req.session.save(function () {
                return res.redirect('/produto/index');
            });
            return;
        }
        req.flash('success', 'Produto registrado com sucesso');
        req.session.save(() => res.redirect(`/produto/index/${produto.produto.id}`));
        return;
    } catch (e) {
        console.log(e);
        return res.render('404');
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
            req.session.save(function () {
                return res.redirect('/produto/index');
            });
            return;
        }
        req.flash('success', 'Produto atualizado com sucesso');
        req.session.save(() => res.redirect(`/produto/index/${produto.produto.id}`));
        return;

    } catch (e) {
        console.log(e);
        res.render('404');
    }

};
exports.delete = async (req,res)=>{
    if (!req.params.id) return res.render('404');

    const produto = await Produto.delete(req.params.id);

    if (!produto) return res.render('404');
    req.flash('success', 'Produto apagado com sucesso');
    req.session.save(() => res.redirect('/'));

}