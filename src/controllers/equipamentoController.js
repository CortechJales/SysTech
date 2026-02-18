const Equipamento = require('../models/equipamentoModel');
const Marca = require('../models/marcaModel');

exports.index = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const marcas = await Marca.buscaMarcas(); // Busca todas as marcas cadastradas
        
        res.render('equipamento/cadastroEquipamento', { 
            equipamento: {}, 
            clienteId, 
            marcas 
        });
    } catch (e) {
        res.render('404');
    }
};

exports.list = async (req, res) => {
  try {
    let equipamentos = await Equipamento.buscaEquipamentos() || [];

    equipamentos.sort((a, b) => {
      const nomeA = a.cliente?.nome?.toLowerCase() || '';
      const nomeB = b.cliente?.nome?.toLowerCase() || '';

      // 1ª Camada: Comparar nomes dos clientes
      if (nomeA < nomeB) return -1;
      if (nomeA > nomeB) return 1;

      // 2ª Camada: Se o nome for IGUAL, ordena pela Data (mais recente primeiro)
      const dataA = new Date(a.criadoEm);
      const dataB = new Date(b.criadoEm);
      return dataB - dataA; // Ordem decrescente de data
    });

    res.render('equipamento/index', { equipamentos });
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

exports.register = async (req, res) => {
    try {
        const equipamento = new Equipamento(req.body);
        await equipamento.register();

        if (equipamento.errors.length > 0) {
            req.flash('errors', equipamento.errors);
            req.session.save(() => res.redirect('/'));
            return;
        }

        req.flash('success', 'Equipamento cadastrado com sucesso.');
        // Redireciona de volta para a ficha do cliente
        req.session.save(() => res.redirect(`/equipamento/load/${equipamento.equipamento.id}`));
    } catch (e) {
        console.log(e);
        res.render('404');
    }
};

exports.editIndex = async (req, res) => {
    if (!req.params.id) return res.render('404');
    
    const [equipamento, marcas] = await Promise.all([
        Equipamento.buscaPorId(req.params.id),
        Marca.buscaMarcas()
    ]);

    if (!equipamento) return res.render('404');

    res.render('equipamento/cadastroEquipamento', { 
        equipamento, 
        clienteId: equipamento.cliente._id,
        marcas 
    });
};

exports.edit = async (req, res) => {
    try {
        const equipamento = new Equipamento(req.body);
        await equipamento.edit(req.params.id);

        if (equipamento.errors.length > 0) {
            req.flash('errors', equipamento.errors);
            req.session.save(() => res.redirect('/'));
            return;
        }

        req.flash('success', 'Equipamento atualizado.');
        req.session.save(() => res.redirect(`/equipamento/load/${equipamento.equipamento.id}`));
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