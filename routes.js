const express=require('express');
const route=express.Router();

const homeController =require('./src/controllers/homeController');
const loginController =require('./src/controllers/loginController');
const contatoController =require('./src/controllers/contatoController');
const clienteController =require('./src/controllers/clienteController');
const marcaController =require('./src/controllers/marcaController');
const produtoController =require('./src/controllers/produtoController');
const equipamentoController =require('./src/controllers/equipamentoController');

const{loginRequired} = require('./src/middlewares/middleware');

//rotas da login
route.get('/',homeController.index); 

//Rotas de login
route.get('/login/index',loginController.index)
route.post('/login/register',loginController.register)
route.post('/login/login',loginController.login)
route.get('/login/logout',loginController.logout)

//Rotas de cliente
route.get('/cliente/index',loginRequired,clienteController.index)
route.post('/cliente/register',loginRequired,clienteController.register)
route.get('/cliente/index/:id',loginRequired,clienteController.editIndex)
route.post('/cliente/edit/:id',loginRequired,clienteController.edit)
route.get('/cliente/delete/:id',loginRequired,clienteController.delete)

//Rotas de produto
route.get('/produto/index',loginRequired,produtoController.index)
route.post('/produto/register',loginRequired,produtoController.register)
route.get('/produto/index/:id',loginRequired,produtoController.editIndex)
route.post('/produto/edit/:id',loginRequired,produtoController.edit)
route.get('/produto/delete/:id',loginRequired,produtoController.delete)

//Rotas de Marca
route.get('/marca/index',loginRequired,marcaController.index)
route.post('/marca/register',loginRequired,marcaController.register)
route.get('/marca/index/:id',loginRequired,marcaController.editIndex)
route.post('/marca/edit/:id',loginRequired,marcaController.edit)
route.get('/marca/delete/:id',loginRequired,marcaController.delete)

//Rotas de Equipamento
route.get('/equipamento/index',loginRequired,equipamentoController.index)
route.post('/equipamento/register',loginRequired,equipamentoController.register)
route.get('/equipamento/index/:id',loginRequired,equipamentoController.editIndex)
route.post('/equipamento/edit/:id',loginRequired,equipamentoController.edit)
route.get('/equipamento/delete/:id',loginRequired,equipamentoController.delete)

module.exports=route;