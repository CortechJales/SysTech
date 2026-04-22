const { connectLocal } = require('../db/connections');
const { OrdemServico } = require('../models/osModel');


// 🔥 AJUSTE DE DATA PARA FILTRO
function ajustarDataFiltro(dataStr, fim = false) {
  if (!dataStr) return null;

  const [ano, mes, dia] = dataStr.split('-');

  if (fim) {
    return new Date(ano, mes - 1, dia, 23, 59, 59);
  }

  return new Date(ano, mes - 1, dia, 0, 0, 0);
}


// 🔥 FORMATA PARA INPUT (YYYY-MM-DD)
function formatarDataInput(data) {
  if (!data) return '';
  return data.toISOString().split('T')[0];
}


exports.index = async (req, res) => {
  try {
    res.render('relatorio/index', { 
      dados: [], 
      filtros: {
        dataInicio: '',
        dataFim: '',
        nomeCliente: '',
        equipamento: '',
        valorMin: '',
        valorMax: '',
        item: '',
        status: []
      }, 
      csrfToken: req.csrfToken() 
    });
  } catch (e) {
    console.error(e);
    res.render('404');
  }
};


exports.buscar = async (req, res) => {
  try {
    const conn = await connectLocal();

    // 🔥 FILTROS PARA CONSULTA (COM DATE CORRETO)
    const filtros = {
      dataInicio: ajustarDataFiltro(req.body.dataInicio),
      dataFim: ajustarDataFiltro(req.body.dataFim, true),
      nomeCliente: req.body.nomeCliente || '',
      equipamento: req.body.equipamento || '',
      valorMin: req.body.valorMin || '',
      valorMax: req.body.valorMax || '',
      item: req.body.item || '',
      status: Array.isArray(req.body.status) 
        ? req.body.status 
        : (req.body.status ? [req.body.status] : [])
    };

    console.log('Filtros recebidos:', filtros);

    const dados = await OrdemServico.relatorio(filtros, conn);

    // 🔥 FILTROS PARA VIEW (STRING PRA INPUT)
    const filtrosView = {
      ...filtros,
      dataInicio: formatarDataInput(filtros.dataInicio),
      dataFim: formatarDataInput(filtros.dataFim)
    };

    res.render('relatorio/index', { 
      dados, 
      filtros: filtrosView, 
      csrfToken: req.csrfToken() 
    });

  } catch (e) {
    console.error(e);
    res.render('404');
  }
};