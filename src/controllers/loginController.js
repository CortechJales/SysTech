const { Login } = require('../models/LoginModel');
const { connectLocal, connectOnline } = require('../db/connections');

exports.index = (req, res) => {
  if (req.session.user) return res.render('login-logado');
  return res.render('login');
};

exports.register = async (req, res) => {
  try {
    const localConn = await connectLocal();
    // Passamos a conexão local para a classe
    const login = new Login(req.body, localConn);

    await login.register();

    if (login.errors.length) {
      req.flash('errors', login.errors);
      return req.session.save(() => res.redirect('/login/index'));
    }

    // Tenta sincronizar online imediatamente (opcional, já que o Worker fará isso)
    try {
      const onlineConn = await connectOnline();
      if (onlineConn) {
        const onlineLogin = new Login(req.body, onlineConn);
        await onlineLogin.register();
      }
    } catch (e) {
      console.log('☁️ Sync online pendente (será processado pela fila)');
    }

    req.flash('success', 'Usuário criado com sucesso!');
    return req.session.save(() => res.redirect('/login/index'));

  } catch (e) {
    console.error(e);
    return res.render('404');
  }
};

exports.login = async (req, res) => {
  try {
    const localConn = await connectLocal();
    const login = new Login(req.body, localConn);

    await login.login();

    if (login.errors.length > 0) {
      req.flash('errors', login.errors);
      return req.session.save(() => res.redirect('/login/index'));
    }

    req.flash('success', 'Você entrou no sistema.');
    req.session.user = login.user;
    return req.session.save(() => res.redirect('/login/index'));

  } catch (e) {
    console.error(e);
    return res.status(500).render('404');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};