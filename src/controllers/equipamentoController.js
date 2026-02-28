const { Equipamento } = require('../models/EquipamentoModel');
const { Marca } = require('../models/MarcaModel'); // Certifique-se das chaves { }
const { connectLocal } = require('../db/connections');

exports.index = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const localConn = await connectLocal();

    // 🔥 O segredo: Passar a conexão local para buscar as marcas
    const marcas = await Marca.buscaMarcas(localConn); 
    
    res.render('equipamento/cadastroEquipamento', { 
      equipamento: {}, 
      clienteId, 
      marcas // Agora as marcas chegam na View
    });
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};

exports.editIndex = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();
    
    const [equipamento, marcas] = await Promise.all([
      Equipamento.buscaPorId(req.params.id, localConn),
      Marca.buscaMarcas(localConn) // Busca marcas para o select de edição
    ]);

    if (!equipamento) return res.render('404');

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

exports.list = async (req, res) => {
    try {
        const localConn = await connectLocal();
        const equipamentos = await Equipamento.buscaEquipamentos(localConn);
        res.render('equipamento/index', { equipamentos });
    } catch (e) {
        res.render('404');
    }
};

// 🔥 Nova listagem filtrada por cliente
exports.listPorCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        if (!clienteId) return res.render('404');

        const localConn = await connectLocal();
        const equipamentos = await Equipamento.buscaPorCliente(clienteId, localConn);
        
        // Renderiza a mesma index, mas com os dados filtrados
        res.render('equipamento/index', { equipamentos });
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
            return req.session.save(() => res.redirect('cliente/list'));
        }
        req.flash('success', 'Equipamento cadastrado.');
        req.session.save(() => res.redirect(`/equipamento/load/${equipamento.equipamento._id}`));
    } catch (e) {
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
            return req.session.save(() => res.redirect('cliente/list'));
        }
        req.flash('success', 'Equipamento atualizado.');
        req.session.save(() => res.redirect(`/equipamento/load/${req.params.id}`));
    } catch (e) {
        res.render('404');
    }
};

exports.delete = async (req, res) => {
    try {
        const localConn = await connectLocal();
        await Equipamento.delete(req.params.id, localConn);
        req.flash('success', 'Equipamento removido.');
        req.session.save(() => res.redirect('/equipamento/list'));
    } catch (e) {
        res.render('404');
    }
};