const { Marca } = require('../models/MarcaModel');
const { connectLocal } = require('../db/connections');

exports.index = (req, res) => {
  res.render('marca/cadastroMarca', { marca: {} });
};

exports.list = async (req, res) => {
  try {
    const localConn = await connectLocal();
    const marcas = await Marca.buscaMarcas(localConn);
    res.render('marca/index', { marcas });
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

exports.register = async (req, res) => {
  try {
    const localConn = await connectLocal();
    const marca = new Marca(req.body, localConn);
    await marca.register();

    if (marca.errors.length > 0) {
      req.flash('errors', marca.errors);
      return req.session.save(() => res.redirect('/marca/new'));
    }

    req.flash('success', 'Marca cadastrada com sucesso.');
    req.session.save(() => res.redirect(`/marca/load/${marca.marca.id}`));
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

exports.editIndex = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();
    const marca = await Marca.buscaPorID(req.params.id, localConn);
    if (!marca) return res.render('404');

    res.render('marca/cadastroMarca', { marca });
  } catch (e) {
    res.render('404');
  }
};

exports.edit = async (req, res) => {
  try {
    const localConn = await connectLocal();
    const marca = new Marca(req.body, localConn);
    await marca.edit(req.params.id);

    if (marca.errors.length > 0) {
      req.flash('errors', marca.errors);
      return req.session.save(() => res.redirect('back'));
    }

    req.flash('success', 'Marca atualizada com sucesso.');
    req.session.save(() => res.redirect(`/marca/load/${marca.marca.id}`));
  } catch (e) {
    console.log(e);
    res.render('404');
  }
};

exports.delete = async (req, res) => {
  try {
    if (!req.params.id) return res.render('404');
    const localConn = await connectLocal();
    const marca = await Marca.delete(req.params.id, localConn);

    if (!marca) return res.render('404');
    req.flash('success', 'Marca apagada com sucesso');
    req.session.save(() => res.redirect('/marca/list'));
  } catch (e) {
    res.render('404');
  }
};