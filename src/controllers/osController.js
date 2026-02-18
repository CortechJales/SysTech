const OrdemServico = require('../models/osModel');
const Cliente = require('../models/ClienteModel');
const Equipamento = require('../models/equipamentoModel');
const Produto = require('../models/ProdutoModel');

// Abre o formulário para um NOVO orçamento/OS
exports.index = async (req, res) => {
  try {
    const { clienteId, equipId } = req.params;
    
    // Buscamos os dados para exibir no cabeçalho do formulário e o catálogo de produtos
    const [cliente, equipamento, produtos] = await Promise.all([
      Cliente.buscaPorID(clienteId),
      Equipamento.buscaPorId(equipId),
      Produto.buscaProduto()// Lista para o seletor de peças
    ]);

    if (!cliente || !equipamento) return res.render('404');

    // Passamos um objeto 'os' vazio com array de itens para o EJS não quebrar
    res.render('ordemServico/cadastroOS', { 
      os: { itens: [], mao_de_obra: 0, valorTotalGeral: 0, status: 'Em orçamento' }, 
      cliente, 
      equipamento, 
      produtos 
    });
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

// Salva o novo registro no banco
exports.register = async (req, res) => {
  try {
    const os = new OrdemServico(req.body);
    await os.register();

    if (os.errors.length > 0) {
      req.flash('errors', os.errors);
      return req.session.save(() => res.redirect('back'));
    }

    req.flash('success', 'Ordem de Serviço/Orçamento criado com sucesso.');
    req.session.save(() => res.redirect(`/os/load/${os.os._id}`));
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

// Lista todas as OS/Orçamentos ATIVOS
exports.list = async (req, res) => {
  try {
    const servicos = await OrdemServico.buscaTodos();
    res.render('ordemServico/index', { servicos });
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

// Carrega os dados de uma OS existente para edição
exports.editIndex = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    
    const os = await OrdemServico.buscaPorId(req.params.id);
    if (!os) return res.render('404');

    const produtos = await Produto.buscaProduto();

    res.render('ordemServico/cadastroOS', { 
      os, 
      cliente: os.cliente, 
      equipamento: os.equipamento, 
      produtos 
    });
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

// Processa a atualização dos dados
exports.edit = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const os = new OrdemServico(req.body);
    
    await os.edit(req.params.id);

    if (os.errors.length > 0) {
      req.flash('errors', os.errors);
      return req.session.save(() => res.redirect('/os/list'));
    }

    req.flash('success', 'Registro atualizado com sucesso.');
    req.session.save(() => res.redirect(`/os/load/${req.params.id}`));
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

// Exclusão lógica (Inativa o registro)
exports.delete = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    
    // Em vez de remover, apenas setamos ativo como false
    await OrdemServico.OSModel.findByIdAndUpdate(req.params.id, { ativo: false });

    req.flash('success', 'Registro inativado com sucesso.');
    req.session.save(() => res.redirect('/os/list'));
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};