const express=require('express');
const route=express.Router();

const homeController =require('./src/controllers/homeController');
const loginController =require('./src/controllers/loginController');
const contatoController =require('./src/controllers/contatoController');
const clienteController =require('./src/controllers/clienteController');
const marcaController =require('./src/controllers/marcaController');
const produtoController =require('./src/controllers/produtoController');
const equipamentoController =require('./src/controllers/equipamentoController');
const osController =require('./src/controllers/osController');

const{loginRequired} = require('./src/middlewares/middleware');

//rotas da login
route.get('/',homeController.index); 

//Rotas de login
route.get('/login/index',loginController.index)
route.post('/login/register',loginController.register)
route.post('/login/login',loginController.login)
route.get('/login/logout',loginController.logout)

//Rotas de cliente
route.get('/cliente/new',loginRequired,clienteController.index)
route.get('/cliente/list',loginRequired,clienteController.list)
route.post('/cliente/register',loginRequired,clienteController.register)
route.get('/cliente/load/:id',loginRequired,clienteController.editIndex)
route.post('/cliente/edit/:id',loginRequired,clienteController.edit)
route.get('/cliente/delete/:id',loginRequired,clienteController.delete)

//Rotas de produto
route.get('/produto/new',loginRequired,produtoController.index)
route.get('/produto/list',loginRequired,produtoController.list)
route.post('/produto/register',loginRequired,produtoController.register)
route.get('/produto/load/:id',loginRequired,produtoController.editIndex)
route.post('/produto/edit/:id',loginRequired,produtoController.edit)
route.get('/produto/delete/:id',loginRequired,produtoController.delete)

//Rotas de Marca
route.get('/marca/new',loginRequired,marcaController.index)
route.get('/marca/list',loginRequired,marcaController.list)
route.post('/marca/register',loginRequired,marcaController.register)
route.get('/marca/load/:id',loginRequired,marcaController.editIndex)
route.post('/marca/edit/:id',loginRequired,marcaController.edit)
route.get('/marca/delete/:id',loginRequired,marcaController.delete)

//Rotas de Equipamento
route.get('/equipamento/new/:clienteId', equipamentoController.index);
route.get('/equipamento/list', loginRequired, equipamentoController.list);
route.get('/equipamento/list/:clienteId', loginRequired, equipamentoController.listPorCliente);
route.post('/equipamento/register',loginRequired,equipamentoController.register)
route.get('/equipamento/load/:id',loginRequired,equipamentoController.editIndex)
route.post('/equipamento/edit/:id',loginRequired,equipamentoController.edit)
route.get('/equipamento/delete/:id',loginRequired,equipamentoController.delete)

// Rotas de Ordem de Serviço (OS) e Orçamentos
route.get('/os/index/:clienteId/:equipId', loginRequired, osController.index);
route.get('/os/list', loginRequired, osController.list);
route.post('/os/register', loginRequired, osController.register);
route.get('/os/load/:id', loginRequired, osController.editIndex);
route.post('/os/edit/:id', loginRequired, osController.edit);
route.get('/os/delete/:id', loginRequired, osController.delete);
module.exports=route;