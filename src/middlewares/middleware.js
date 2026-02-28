exports.middlewareGlobal = (req, res, next) => {
  // Injeta variáveis globais para as views
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');
  res.locals.user = req.session.user || null;

  // ✅ CSRF seguro para WEB e ELECTRON
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  } else {
    res.locals.csrfToken = '';
  }

  next();
};

exports.checkCsrfError = (err, req, res, next) => {
  if (err) {
    console.error('Erro detectado (CSRF ou outro):', err.message);
    
    // 🔥 IMPORTANTE: Garante que as variáveis existam mesmo no erro
    // Isso evita o erro "user is not defined" no nav.ejs
    res.locals.user = req.session.user || null;
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');
    res.locals.csrfToken = ''; // Evita erro se a view esperar o token

    return res.status(403).render('404');
  }
  next();
};

exports.csrfMiddleware = (req, res, next) => {
  // Mantido conforme sua necessidade atual
  next();
};

exports.loginRequired = (req, res, next) => {
  if (!req.session.user) {
    req.flash('errors', 'Você precisa fazer login.');
    return req.session.save(() => res.redirect('/'));
  }
  next();
};