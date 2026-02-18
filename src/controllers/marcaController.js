const Marca = require('../models/marcaModel');

exports.index = async (req, res) => {
       res.render('marca/cadastroMarca', { marca: {} });
};

exports.list = async (req, res) => {
     const marcas = await Marca.buscaMarcas();
       res.render('marca/index', { marcas});
};

exports.register = async (req, res) => {
    try {
        const marca = new Marca(req.body);
        await marca.register();

        if (marca.errors.length > 0) {
            req.flash('errors', marca.errors);
            req.session.save(() => res.redirect('/marca/index'));
            return;
        }

        req.flash('success', 'Equipamento cadastrado com sucesso.');
        // Redireciona de volta para a ficha do cliente
        req.session.save(() => res.redirect(`/marca/load/${marca.marca.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    if (!req.params.id) return res.render('404');
    const marca = await Marca.buscaPorID(req.params.id);
    if (!marca) return res.render('404');

    res.render('marca/cadastroMarca', {marca});
};

exports.edit = async (req, res) => {
    try {
        const marca = new Marca(req.body);
        await marca.edit(req.params.id);

        if (marca.errors.length > 0) {
            req.flash('errors', marca.errors);
            req.session.save(() => res.redirect('marca/cadastroMarca'));
            return;
        }

        req.flash('success', 'Marca atualizado.');
        req.session.save(() => res.redirect(`/marca/load/${marca.marca.id}`));
    } catch (e) {
        res.render('404');
    }
};

exports.delete = async (req,res)=>{
    if (!req.params.id) return res.render('404');

    const marca = await Marca.delete(req.params.id);

    if (!marca) return res.render('404');
    req.flash('success', 'Marca apagado com sucesso');
    req.session.save(() => res.redirect('/marca/list'));

};