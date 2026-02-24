exports.middlewareGlobal = (req, res, next) => {
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

exports.outroMiddleware = (req, res, next) => {
  next();
};

exports.checkCsrfError = (err, req, res, next) => {
  if (err) {
    console.error('Erro CSRF:', err.message);
    return res.render('404');
  }
  next();
};

// ⚠️ NÃO usa mais req.csrfToken direto aqui
exports.csrfMiddleware = (req, res, next) => {
  next();
};

exports.loginRequired = (req, res, next) => {
  if (!req.session.user) {
    req.flash('errors', 'Você precisa fazer login.');
    return req.session.save(() => res.redirect('/'));
  }
  next();
};