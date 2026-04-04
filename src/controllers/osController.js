const { OrdemServico, OrdemServicoSchema } = require('../models/osModel');
const { Cliente } = require('../models/ClienteModel');
const { Equipamento } = require('../models/EquipamentoModel');
const { Produto } = require('../models/ProdutoModel');
const { connectLocal } = require('../db/connections');


// 🔥 CORREÇÃO DEFINITIVA DE DATA (LOCAL)
function ajustarData(dataStr) {
  if (!dataStr) return null;

  const [ano, mes, dia] = dataStr.split('-');
  return new Date(ano, mes - 1, dia);
}


exports.index = async (req, res) => {
  try {
    const { clienteId, equipId } = req.params;
    const localConn = await connectLocal();
    
    const [cliente, equipamento, produtos] = await Promise.all([
      Cliente.buscaPorID(clienteId, localConn),
      Equipamento.buscaPorId(equipId, localConn),
      Produto.buscaProduto(localConn)
    ]);

    if (!cliente || !equipamento) return res.render('404');

    res.render('ordemServico/cadastroOS', { 
      os: { itens: [], mao_de_obra: 0, valorTotalGeral: 0, status: 'Em orçamento' }, 
      cliente, 
      equipamento, 
      produtos 
    });
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};


exports.register = async (req, res) => {
  try {
    const localConn = await connectLocal();

    // 🔥 AJUSTE DAS DATAS
    req.body.data_inicio = ajustarData(req.body.data_inicio);
    req.body.data_final = ajustarData(req.body.data_final);
    req.body.data_orcamento_passado = ajustarData(req.body.data_orcamento_passado);
    req.body.data_orcamento_aprovado = ajustarData(req.body.data_orcamento_aprovado);

    const os = new OrdemServico(req.body, localConn);
    await os.register();

    if (os.errors.length > 0) {
      req.flash('errors', os.errors);
      return req.session.save(() => res.redirect('back'));
    }

    req.flash('success', 'Ordem de Serviço criada com sucesso.');
    req.session.save(() => res.redirect(`/os/load/${os.os._id}`));
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};


exports.list = async (req, res) => {
  try {
    const localConn = await connectLocal();
    const servicos = await OrdemServico.buscaTodos(localConn);
    res.render('ordemServico/index', { servicos });
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};


exports.editIndex = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();
    
    const os = await OrdemServico.buscaPorId(req.params.id, localConn);
    if (!os) return res.render('404');

    const produtos = await Produto.buscaProduto(localConn);

    res.render('ordemServico/cadastroOS', { 
      os, 
      cliente: os.cliente, 
      equipamento: os.equipamento, 
      produtos 
    });
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};


exports.edit = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();

    // 🔥 AJUSTE DAS DATAS
    req.body.data_inicio = ajustarData(req.body.data_inicio);
    req.body.data_final = ajustarData(req.body.data_final);
    req.body.data_orcamento_passado = ajustarData(req.body.data_orcamento_passado);
    req.body.data_orcamento_aprovado = ajustarData(req.body.data_orcamento_aprovado);

    const os = new OrdemServico(req.body, localConn);
    
    await os.edit(req.params.id);

    if (os.errors.length > 0) {
      req.flash('errors', os.errors);
      return req.session.save(() => res.redirect('back'));
    }

    req.flash('success', 'Registro atualizado com sucesso.');
    req.session.save(() => res.redirect(`/os/load/${req.params.id}`));
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};


exports.delete = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();

    const Model = localConn.models.OrdemServico || 
                  localConn.model('OrdemServico', OrdemServicoSchema);
    
    const os = await Model.findByIdAndUpdate(req.params.id, { ativo: false });
    
    if (os) {
        const SyncQueue = localConn.models.SyncQueue || 
                          localConn.model('SyncQueue', require('../models/SyncQueueModel'));

        await SyncQueue.create({
            collectionName: 'OrdemServico',
            action: 'update',
            payload: { _id: req.params.id, ativo: false },
        });
    }

    req.flash('success', 'Registro inativado com sucesso.');
    req.session.save(() => res.redirect('/os/list'));
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};