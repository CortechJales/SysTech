const Cliente = require('../models/ClienteModel');


exports.index = (req, res) => {
    res.render('cliente/cadastroCliente', { cliente: {} });
};

exports.register = async (req, res) => {
    try {
        const cliente = new Cliente(req.body);
        await cliente.register();

        if (cliente.errors.length > 0) {
            req.flash('errors', cliente.errors);
            req.session.save(function () {
                return res.redirect('/cliente/index');
            });
            return;
        }
        req.flash('success', 'Cliente registrado com sucesso');
        req.session.save(() => res.redirect(`/cliente/index/${cliente.cliente.id}`));
        return;
    } catch (e) {
        console.log(e);
        return res.render('404');
    }

};

exports.editIndex = async (req, res) => {
    if (!req.params.id) return res.render('404');

    const cliente = await Cliente.buscaPorID(req.params.id);

    if (!cliente) return res.render('404');

    res.render('cliente/cadastroCliente', { cliente });
};
exports.edit = async (req, res) => {
    try {
        if (!req.params.id) return res.render('404');
        const cliente = new Cliente(req.body);
        await cliente.edit(req.params.id);

        if (cliente.errors.length > 0) {

            req.flash('errors', cliente.errors);
            req.session.save(function () {
                return res.redirect('/cliente/index');
            });
            return;
        }
        req.flash('success', 'Cliente atualizado com sucesso');
        req.session.save(() => res.redirect(`/cliente/index/${cliente.cliente.id}`));
        return;

    } catch (e) {
        console.log(e);
        res.render('404');
    }

};
exports.delete = async (req,res)=>{
    if (!req.params.id) return res.render('404');

    const cliente = await Cliente.delete(req.params.id);

    if (!cliente) return res.render('404');
    req.flash('success', 'Cliente apagado com sucesso');
    req.session.save(() => res.redirect('/'));

}