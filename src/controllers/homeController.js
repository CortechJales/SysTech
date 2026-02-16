const Cliente = require('../models/ClienteModel');

exports.index= async(req,res)=>{
    const clientes = await Cliente.buscaContatos();
    res.render('index',{clientes});
};
