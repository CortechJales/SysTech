const Equipamento = require('../models/equipamentoModel');
const Marca = require('../models/marcaModel');

exports.index = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const marcas = await Marca.buscaMarcas(); // Busca todas as marcas cadastradas
        
        res.render('equipamento', { 
            equipamento: {}, 
            clienteId, 
            marcas 
        });
    } catch (e) {
        res.render('404');
    }
};

exports.register = async (req, res) => {
    try {
        const equipamento = new Equipamento(req.body);
        await equipamento.register();

        if (equipamento.errors.length > 0) {
            req.flash('errors', equipamento.errors);
            req.session.save(() => res.redirect('back'));
            return;
        }

        req.flash('success', 'Equipamento cadastrado com sucesso.');
        // Redireciona de volta para a ficha do cliente
        req.session.save(() => res.redirect(`/cliente/index/${req.body.cliente}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    if (!req.params.id) return res.render('404');
    const equipamento = await Equipamento.buscaPorId(req.params.id);
    if (!equipamento) return res.render('404');

    res.render('equipamento', { 
        equipamento, 
        clienteId: equipamento.cliente._id 
    });
};

exports.edit = async (req, res) => {
    try {
        const equipamento = new Equipamento(req.body);
        await equipamento.edit(req.params.id);

        if (equipamento.errors.length > 0) {
            req.flash('errors', equipamento.errors);
            req.session.save(() => res.redirect('back'));
            return;
        }

        req.flash('success', 'Equipamento atualizado.');
        req.session.save(() => res.redirect(`/cliente/index/${req.body.cliente}`));
    } catch (e) {
        res.render('404');
    }
};

exports.delete = async (req,res)=>{
    if (!req.params.id) return res.render('404');

    const equipamento = await Equipamento.delete(req.params.id);

    if (!equipamento) return res.render('404');
    req.flash('success', 'Equipamento apagado com sucesso');
    req.session.save(() => res.redirect('/'));

}